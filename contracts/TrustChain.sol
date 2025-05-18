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
    uint256 public constant ENDORSEMENT_TRUST_BONUS = 10; // For endorsee
    uint256 public constant LOAN_REPAID_TRUST_BONUS = 20;
    uint256 public constant LOAN_DEFAULT_TRUST_PENALTY = 100;
    uint256 public constant DEFAULT_INTEREST_RATE = 700; // 7% in basis points
    uint256 public constant LOAN_DURATION = 30 days;

    event UserRegistered(address indexed userAddr);
    event UserEndorsed(uint256 indexed endorsementId, address indexed endorser, address indexed endorsee, uint256 amountStaked);
    event EndorsementStakeWithdrawn(uint256 indexed endorsementId, address indexed endorser, address indexed endorsee, uint256 amountWithdrawn);
    event TrustScoreUpdated(address indexed userAddr, uint256 newTrustScore);
    
    event CapitalDeposited(address indexed depositor, uint256 amount);
    event CapitalWithdrawn(address indexed depositor, uint256 amount);
    
    event LoanRequested(uint256 indexed loanId, address indexed borrower, uint256 amount);
    event LoanApproved(uint256 indexed loanId, address indexed lender, uint256 repaymentAmount, uint256 repaymentDeadline);
    event LoanRepaid(uint256 indexed loanId);
    event LoanDefaulted(uint256 indexed loanId);


    modifier onlyRegisteredUser() {
        require(isUserRegistered[msg.sender], "User not registered");
        _;
    }

    constructor() {
        // You could register the deployer or leave it for manual registration
    }

    function registerUser() external {
        require(!isUserRegistered[msg.sender], "User already registered");

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
        require(isUserRegistered[_endorsee], "Endorsee not registered");
        require(_endorsee != msg.sender, "Cannot endorse yourself");
        require(msg.value > 0, "Stake amount must be greater than 0");
        require(userEndorsementIds[_endorsee][msg.sender] == 0, "Already endorsed this user"); // Simplified: one endorsement per pair

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
    
    // Simplified withdrawal: only if endorsee has no active loans. More complex logic needed for partial defaults.
    function withdrawEndorsementStake(address _endorsee) external nonReentrant onlyRegisteredUser {
        uint256 endorsementId = userEndorsementIds[_endorsee][msg.sender];
        require(endorsementId != 0, "No active endorsement for this user");
        Endorsement storage endorsement = endorsements[endorsementId];
        require(endorsement.endorser == msg.sender, "Not your endorsement");
        require(endorsement.active, "Endorsement not active");

        // Check if endorsee has any *Approved* (i.e. outstanding) loans
        // This is a simplified check. A robust system would check against specific loans covered by this endorsement.
        bool endorseeHasActiveLoans = false;
        uint256[] storage activeLoanIds = userActiveLoans[_endorsee];
        for(uint i=0; i < activeLoanIds.length; i++){
            if(loans[activeLoanIds[i]].status == LoanStatus.Approved){
                
                endorseeHasActiveLoans = true;
                break;
            }
        }
        require(!endorseeHasActiveLoans, "Endorsee has active loans, cannot withdraw stake yet");

        uint256 amountToWithdraw = endorsement.amountStaked;
        require(totalLiquidity >= amountToWithdraw, "Insufficient pool liquidity to withdraw stake");

        endorsement.active = false;
        endorsement.amountStaked = 0;

        User storage endorseeUser = users[_endorsee];
        endorseeUser.endorsementsReceivedCount--;
        endorseeUser.totalStakedOnUser -= amountToWithdraw;
         // Optionally, adjust trust score down if an endorsement is removed
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
        // Max trust score can be capped if needed, e.g., 1000
        // if (user.trustScore > 1000) user.trustScore = 1000;
        emit TrustScoreUpdated(_userAddr, user.trustScore);
    }

    // --- Lending Pool ---
    function depositCapital() external payable nonReentrant onlyRegisteredUser {
        require(msg.value > 0, "Deposit amount must be positive");
        userDeposits[msg.sender] += msg.value;
        totalLiquidity += msg.value;
        emit CapitalDeposited(msg.sender, msg.value);
    }

    function withdrawCapital(uint256 _amount) external nonReentrant onlyRegisteredUser {
        require(_amount > 0, "Withdrawal amount must be positive");
        require(userDeposits[msg.sender] >= _amount, "Insufficient deposited capital");
        // This is a basic check. A more robust system might consider pro-rata share of available liquidity
        // if (totalLiquidity - loans outstanding) < _amount
        require(totalLiquidity >= _amount, "Insufficient pool liquidity");

        userDeposits[msg.sender] -= _amount;
        totalLiquidity -= _amount;
        payable(msg.sender).transfer(_amount);
        emit CapitalWithdrawn(msg.sender, _amount);
    }

    // --- Loans ---
    function requestLoan(uint256 _amount) external nonReentrant onlyRegisteredUser {
        require(_amount > 0, "Loan amount must be positive");
        User storage borrower = users[msg.sender];
        require(borrower.trustScore >= MIN_TRUST_SCORE_FOR_LOAN, "Trust score too low");
        // Potentially add checks like max loan amount based on trust score or existing active loans

        _loanIds.increment();
        uint256 loanId = _loanIds.current();

        uint256 interest = (_amount * DEFAULT_INTEREST_RATE) / 10000;
        uint256 repaymentAmount = _amount + interest;

        loans[loanId] = Loan({
            loanId: loanId,
            borrower: msg.sender,
            amount: _amount,
            interestRate: DEFAULT_INTEREST_RATE,
            repaymentAmount: repaymentAmount,
            requestedTimestamp: block.timestamp,
            approvalTimestamp: 0,
            repaymentDeadline: 0,
            lender: address(0), // Will be contract address if approved from pool
            status: LoanStatus.Requested,
            exists: true
        });
        
        emit LoanRequested(loanId, msg.sender, _amount);

        // Auto-approve for simplicity if funds available
        if (totalLiquidity >= _amount) {
            _approveLoan(loanId);
        }
    }

    function _approveLoan(uint256 _loanId) internal {
        Loan storage loan = loans[_loanId];
        // require(loan.status == Loan.LoanStatus.Requested, "Loan not in requested state"); // Already checked by caller context
        require(totalLiquidity >= loan.amount, "Insufficient pool liquidity for this loan");

        loan.status = LoanStatus.Approved;
        loan.lender = address(this); // Loan is from the pool
        loan.approvalTimestamp = block.timestamp;
        loan.repaymentDeadline = block.timestamp + LOAN_DURATION;
        
        totalLiquidity -= loan.amount; // Allocate funds from pool
        userActiveLoans[loan.borrower].push(_loanId);

        payable(loan.borrower).transfer(loan.amount);

        emit LoanApproved(_loanId, address(this), loan.repaymentAmount, loan.repaymentDeadline);
    }

    function repayLoan(uint256 _loanId) external payable nonReentrant {
        Loan storage loan = loans[_loanId];
        require(loan.exists, "Loan does not exist");
        require(loan.borrower == msg.sender, "Not your loan");
        require(loan.status == LoanStatus.Approved, "Loan not in approved state");
        require(msg.value == loan.repaymentAmount, "Incorrect repayment amount");

        loan.status = LoanStatus.Repaid;
        totalLiquidity += loan.repaymentAmount; // Repayment + interest goes back to pool

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

        emit LoanRepaid(_loanId);
    }

    function liquidateDefaultedLoan(uint256 _loanId) external nonReentrant {
        Loan storage loan = loans[_loanId];
        require(loan.exists, "Loan does not exist");
        require(loan.status == LoanStatus.Approved, "Loan not active or already handled");
        require(block.timestamp > loan.repaymentDeadline, "Loan not yet past deadline");

        loan.status = LoanStatus.Defaulted;

        User storage borrower = users[loan.borrower];
        borrower.loansDefaulted++;
        _updateTrustScore(loan.borrower, LOAN_DEFAULT_TRUST_PENALTY, false);

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
        require(isUserRegistered[_userAddr], "User not registered");
        return users[_userAddr];
    }

    function getLoan(uint256 _loanId) external view returns (Loan memory) {
        require(loans[_loanId].exists, "Loan does not exist");
        return loans[_loanId];
    }

    function getEndorsement(uint256 _endorsementId) external view returns (Endorsement memory) {
        require(_endorsementId <= _endorsementIds.current() && _endorsementId > 0, "Invalid endorsement ID");
        return endorsements[_endorsementId];
    }
    
    function getActiveLoansForUser(address _userAddr) external view returns (uint256[] memory) {
        return userActiveLoans[_userAddr];
    }

    function getLendingPoolStats() external view returns (uint256 _totalLiquidity, uint256 _numberOfLoans) {
        return (totalLiquidity, _loanIds.current());
    }
}