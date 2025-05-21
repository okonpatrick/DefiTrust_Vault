// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol"; // For debugging

contract TrustChain is ReentrancyGuard {
    using Counters for Counters.Counter;

    struct User {
        address userAddress;
        uint256 trustScore;
        uint256 endorsementsReceivedCount; // How many users endorsed this user
        uint256 totalStakedOnUser; // Total AVAX staked by others on this user
        uint256 loansCompleted;
        uint256 loansDefaulted;
        bool isRegistered;
    }

    struct Endorsement {
        address endorser;
        address endorsee;
        uint256 amountStaked;
        bool active;
    }

    enum LoanStatus { Requested, Approved, Repaid, Defaulted, Cancelled }

    struct Loan {
        uint256 loanId;
        address borrower;
        uint256 amount;
        uint256 interestRate; // Basis points, e.g., 500 for 5%
        uint256 repaymentAmount;
        uint256 requestedTimestamp;
        uint256 approvalTimestamp;
        uint256 repaymentDeadline;
        address lender; // Could be the contract itself (pool) or a specific lender
        uint256 collateralAmount; // Amount of AVAX locked as collateral
        LoanStatus status;
        bool exists;
    }

    Counters.Counter private _loanIds;
    Counters.Counter private _endorsementIds;

    mapping(address => User) public users;
    mapping(address => bool) public isUserRegistered;

    // endorsee => endorser => endorsementId
    mapping(address => mapping(address => uint256)) public userEndorsementIds;
    mapping(uint256 => Endorsement) public endorsements;

    mapping(uint256 => Loan) public loans;
    mapping(address => uint256[]) public userActiveLoans; // borrower => array of loanIds

    // Lending Pool
    uint256 public totalLiquidity; // Total AVAX in the pool
    mapping(address => uint256) public userDeposits; // User's share of liquidity

    // Constants
    uint256 public constant INITIAL_TRUST_SCORE = 500;
    uint256 public constant MIN_TRUST_SCORE_FOR_LOAN = 400;
    uint256 public constant MAX_TRUST_SCORE = 1000; // Maximum achievable trust score
    uint256 public constant ENDORSEMENT_TRUST_BONUS = 10; // For endorsee
    uint256 public constant LOAN_REPAID_TRUST_BONUS = 20;
    uint256 public constant LOAN_DEFAULT_TRUST_PENALTY = 100;
    uint256 public constant DEFAULT_INTEREST_RATE = 700; // 7% in basis points
    uint256 public constant LOAN_DURATION = 30 days;
    uint256 public constant COLLATERAL_REQUIREMENT_BPS = 13000; // 130% collateral (13000 / 10000)

    event UserRegistered(address indexed userAddr);
    event UserEndorsed(uint256 indexed endorsementId, address indexed endorser, address indexed endorsee, uint256 amountStaked);
    event EndorsementStakeWithdrawn(uint256 indexed endorsementId, address indexed endorser, address indexed endorsee, uint256 amountWithdrawn);
    event TrustScoreUpdated(address indexed userAddr, uint256 newTrustScore);

    event CapitalDeposited(address indexed depositor, uint256 amount);
    event CapitalWithdrawn(address indexed depositor, uint256 amount);
    event LoanRequested(uint256 indexed loanId, address indexed borrower, uint256 amount, uint256 collateralAmount);
    event LoanApproved(uint256 indexed loanId, address indexed lender, uint256 repaymentAmount, uint256 repaymentDeadline);
    event LoanRepaid(uint256 indexed loanId);
    event LoanDefaulted(uint256 indexed loanId);


    modifier onlyRegisteredUser() {
        require(isUserRegistered[msg.sender], "User: Caller not registered");
        _;
    }

    constructor() {
        // You could register the deployer or leave it for manual registration
    }

    function registerUser() external {
        require(!isUserRegistered[msg.sender], "User: Already registered");

        users[msg.sender] = User({
            userAddress: msg.sender,
            trustScore: INITIAL_TRUST_SCORE,
            endorsementsReceivedCount: 0,
            totalStakedOnUser: 0,
            loansCompleted: 0,
            loansDefaulted: 0,
            isRegistered: true
        });
        isUserRegistered[msg.sender] = true;
        emit UserRegistered(msg.sender);
    }

    function endorseUser(address _endorsee) external payable nonReentrant onlyRegisteredUser {
        require(isUserRegistered[_endorsee], "Endorse: Endorsee not registered");
        require(_endorsee != msg.sender, "Endorse: Cannot endorse yourself");
        require(msg.value > 0, "Endorse: Stake amount must be positive");
        require(userEndorsementIds[_endorsee][msg.sender] == 0, "Endorse: Already endorsed this user"); // Simplified: one endorsement per pair

        _endorsementIds.increment();
        uint256 endorsementId = _endorsementIds.current();

        endorsements[endorsementId] = Endorsement({
            endorser: msg.sender,
            endorsee: _endorsee,
            amountStaked: msg.value,
            active: true
        });
        userEndorsementIds[_endorsee][msg.sender] = endorsementId;

        User storage endorseeUser = users[_endorsee];
        endorseeUser.endorsementsReceivedCount++;
        endorseeUser.totalStakedOnUser += msg.value;
        _updateTrustScore(_endorsee, ENDORSEMENT_TRUST_BONUS, true);

        totalLiquidity += msg.value; // Staked amount goes into the pool

        emit UserEndorsed(endorsementId, msg.sender, _endorsee, msg.value);
    }
    
    // Simplified withdrawal: only if endorsee has no *Approved* loans. 
    // A more robust system would need to handle how stakes are affected by defaults more granularly.
    function withdrawEndorsementStake(address _endorsee) external nonReentrant onlyRegisteredUser {
        uint256 endorsementId = userEndorsementIds[_endorsee][msg.sender];
        require(endorsementId != 0, "WithdrawEndorse: No active endorsement for this user by you");
        Endorsement storage endorsement = endorsements[endorsementId];
        require(endorsement.endorser == msg.sender, "WithdrawEndorse: Not your endorsement"); // Should be redundant due to mapping structure but good for safety
        require(endorsement.active, "WithdrawEndorse: Endorsement not active");

        // Check if endorsee has any *Approved* (i.e. outstanding) loans
        // This check prevents withdrawal if the endorsee has any loan that is not yet Repaid or Defaulted.
        bool endorseeHasActiveLoans = false;
        uint256[] storage activeLoanIds = userActiveLoans[_endorsee];
        for(uint i=0; i < activeLoanIds.length; i++){
            if(loans[activeLoanIds[i]].status == LoanStatus.Approved){
                endorseeHasActiveLoans = true;
                break;
            }
        }
        require(!endorseeHasActiveLoans, "WithdrawEndorse: Endorsee has active (Approved) loans, cannot withdraw stake yet");

        uint256 amountToWithdraw = endorsement.amountStaked;
        require(totalLiquidity >= amountToWithdraw, "WithdrawEndorse: Insufficient pool liquidity to withdraw stake");

        endorsement.active = false;
        endorsement.amountStaked = 0;

        User storage endorseeUser = users[_endorsee];
        endorseeUser.endorsementsReceivedCount--;
        endorseeUser.totalStakedOnUser -= amountToWithdraw;
        // Optionally, adjust trust score down if an endorsement is removed (consider implications)
        // _updateTrustScore(_endorsee, ENDORSEMENT_TRUST_BONUS, false);


        totalLiquidity -= amountToWithdraw;
        payable(msg.sender).transfer(amountToWithdraw);

        emit EndorsementStakeWithdrawn(endorsementId, msg.sender, _endorsee, amountToWithdraw);
    }


    function _updateTrustScore(address _userAddr, uint256 _points, bool _increase) internal {
        User storage user = users[_userAddr];
        if (_increase) {
            user.trustScore += _points;
        } else {
            if (user.trustScore >= _points) {
                user.trustScore -= _points;
            } else {
                user.trustScore = 0;
            }
        }
        if (user.trustScore > MAX_TRUST_SCORE) {
            user.trustScore = MAX_TRUST_SCORE;
        }
        emit TrustScoreUpdated(_userAddr, user.trustScore);
    }

    // --- Lending Pool ---
    function depositCapital() external payable nonReentrant onlyRegisteredUser {
        require(msg.value > 0, "Deposit: Amount must be positive");
        userDeposits[msg.sender] += msg.value;
        totalLiquidity += msg.value;
        emit CapitalDeposited(msg.sender, msg.value);
    }

    function withdrawCapital(uint256 _amount) external nonReentrant onlyRegisteredUser {
        require(_amount > 0, "WithdrawCap: Amount must be positive");
        require(userDeposits[msg.sender] >= _amount, "WithdrawCap: Insufficient deposited capital for user");
        
        // Basic check: ensure total pool liquidity is sufficient.
        // A more advanced system would calculate "available liquidity" (totalLiquidity - sum of all active loan amounts).
        // For now, this check prevents draining the pool below the withdrawal amount.
        require(totalLiquidity >= _amount, "WithdrawCap: Insufficient total pool liquidity");

        userDeposits[msg.sender] -= _amount;
        totalLiquidity -= _amount;
        payable(msg.sender).transfer(_amount);
        emit CapitalWithdrawn(msg.sender, _amount);
    }
    
    // --- Loans ---
    // User sends collateral (AVAX) with this function call (msg.value)
    function requestLoan(uint256 _loanAmount) external payable nonReentrant onlyRegisteredUser {
        require(_loanAmount > 0, "LoanReq: Amount must be positive");
        User storage borrower = users[msg.sender];
        require(borrower.isRegistered, "LoanReq: Borrower not registered"); // Redundant due to modifier, but explicit
        require(borrower.trustScore >= MIN_TRUST_SCORE_FOR_LOAN, "LoanReq: Trust score too low");
        // Potentially add checks like max loan amount based on trust score or existing active loans

        uint256 requiredCollateral = (_loanAmount * COLLATERAL_REQUIREMENT_BPS) / 10000;
        require(msg.value == requiredCollateral, "LoanReq: Incorrect collateral amount sent");

        _loanIds.increment();
        uint256 loanId = _loanIds.current();

        uint256 interest = (_loanAmount * DEFAULT_INTEREST_RATE) / 10000;
        uint256 repaymentAmount = _loanAmount + interest;

        loans[loanId] = Loan({
            loanId: loanId,
            borrower: msg.sender,
            amount: _loanAmount,
            interestRate: DEFAULT_INTEREST_RATE,
            repaymentAmount: repaymentAmount,
            requestedTimestamp: block.timestamp,
            approvalTimestamp: 0,
            repaymentDeadline: 0,
            lender: address(0), // Will be contract address if approved from pool
            status: LoanStatus.Requested,
            collateralAmount: msg.value, // Store the actual collateral sent
            exists: true
        });
        
        // The collateral (msg.value) is now held by the contract.
        // It will be returned upon repayment or claimed upon default.

        emit LoanRequested(loanId, msg.sender, _loanAmount, msg.value);

        // Auto-approve for simplicity if funds available
        if (totalLiquidity >= _loanAmount) {
            _approveLoan(loanId);
        }
    }

    function _approveLoan(uint256 _loanId) internal {
        Loan storage loan = loans[_loanId];
        require(loan.exists, "ApproveLoan: Loan does not exist");
        require(loan.status == LoanStatus.Requested, "ApproveLoan: Loan not in requested state");
        require(totalLiquidity >= loan.amount, "ApproveLoan: Insufficient pool liquidity for this loan");

        loan.status = LoanStatus.Approved;
        loan.lender = address(this); // Loan is from the pool
        loan.approvalTimestamp = block.timestamp;
        loan.repaymentDeadline = block.timestamp + LOAN_DURATION;
        
        totalLiquidity -= loan.amount; // Allocate (earmark) funds from pool for this loan
        userActiveLoans[loan.borrower].push(_loanId);

        payable(loan.borrower).transfer(loan.amount);

        emit LoanApproved(_loanId, address(this), loan.repaymentAmount, loan.repaymentDeadline);
    }

    function repayLoan(uint256 _loanId) external payable nonReentrant {
        Loan storage loan = loans[_loanId];
        require(loan.exists, "Repay: Loan does not exist");
        require(loan.borrower == msg.sender, "Repay: Caller is not the borrower");
        require(loan.status == LoanStatus.Approved, "Repay: Loan not in approved state for repayment");
        require(msg.value == loan.repaymentAmount, "Repay: Incorrect repayment amount sent");

        loan.status = LoanStatus.Repaid;
        totalLiquidity += loan.repaymentAmount; // Repayment (principal + interest) goes back to pool

        User storage borrower = users[msg.sender];
        borrower.loansCompleted++;
        _updateTrustScore(msg.sender, LOAN_REPAID_TRUST_BONUS, true);
        
        // Remove from active loans
        uint256[] storage activeLoanIds = userActiveLoans[msg.sender];
        for (uint i = 0; i < activeLoanIds.length; i++) {
            if (activeLoanIds[i] == _loanId) {
                activeLoanIds[i] = activeLoanIds[activeLoanIds.length - 1];
                activeLoanIds.pop();
                break;
            }
        }

        // Return collateral to borrower
        if (loan.collateralAmount > 0) {
            payable(loan.borrower).transfer(loan.collateralAmount);
        }

        emit LoanRepaid(_loanId);
    }

    function liquidateDefaultedLoan(uint256 _loanId) external nonReentrant {
        Loan storage loan = loans[_loanId];
        require(loan.exists, "Liquidate: Loan does not exist");
        require(loan.status == LoanStatus.Approved, "Liquidate: Loan not active or already handled");
        require(block.timestamp > loan.repaymentDeadline, "Liquidate: Loan not yet past repayment deadline");
        // Add a check to ensure only authorized party (e.g., admin or anyone after deadline) can call this

        loan.status = LoanStatus.Defaulted;

        User storage borrower = users[loan.borrower];
        borrower.loansDefaulted++;
        _updateTrustScore(loan.borrower, LOAN_DEFAULT_TRUST_PENALTY, false);

        // Claim collateral and add it to the pool liquidity
        // This compensates the pool for the defaulted loan amount (partially or fully)
        totalLiquidity += loan.collateralAmount;

        // Remove from active loans
        uint256[] storage activeLoanIds = userActiveLoans[loan.borrower];
        for (uint i = 0; i < activeLoanIds.length; i++) {
            if (activeLoanIds[i] == _loanId) {
                activeLoanIds[i] = activeLoanIds[activeLoanIds.length - 1];
                activeLoanIds.pop();
                break;
            }
        }

        emit LoanDefaulted(_loanId);
    }

    // --- View Functions ---
    function getUser(address _userAddr) external view returns (User memory) {
        require(isUserRegistered[_userAddr], "GetUser: User not registered");
        return users[_userAddr];
    }

    function getLoan(uint256 _loanId) external view returns (Loan memory) {
        require(loans[_loanId].exists, "GetLoan: Loan does not exist");
        return loans[_loanId];
    }

    function getEndorsement(uint256 _endorsementId) external view returns (Endorsement memory) {
        require(_endorsementId <= _endorsementIds.current() && _endorsementId > 0, "GetEndorse: Invalid endorsement ID");
        return endorsements[_endorsementId];
    }
    
    function getActiveLoansForUser(address _userAddr) external view returns (uint256[] memory) {
        return userActiveLoans[_userAddr];
    }

    function getLendingPoolStats() external view returns (uint256 _totalLiquidity, uint256 _numberOfLoans) {
        return (totalLiquidity, _loanIds.current());
    }
}