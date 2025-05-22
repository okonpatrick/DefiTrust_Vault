import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-400 py-8 mt-12">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} DeFiTrust Chain. All rights
          reserved.
        </p>
        <div className="mt-2 space-x-4">
          <Link
            to="/terms"
            className="text-sm hover:text-gray-200 transition-colors"
          >
            Terms of Service
          </Link>
          <Link
            to="/privacy"
            className="text-sm hover:text-gray-200 transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            to="/faq"
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            FAQ & Help
          </Link>
          <Link
            to="/endorsers"
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            Become an Endorser
          </Link>
        </div>
      </div>
    </footer>
  );
}
