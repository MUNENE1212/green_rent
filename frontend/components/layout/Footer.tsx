import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-primary-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <span className="text-2xl mr-2">🏡</span>
              GreenRent
            </h3>
            <p className="text-primary-200 text-sm">
              Democratizing housing access through AI-powered flexible payment plans and innovative rental solutions.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-primary-200">
              <li>
                <Link href="/properties" className="hover:text-white transition">
                  Browse Properties
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-white transition">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* For Tenants */}
          <div>
            <h4 className="font-semibold mb-4">For Tenants</h4>
            <ul className="space-y-2 text-sm text-primary-200">
              <li>
                <Link href="/wallet" className="hover:text-white transition">
                  Rent Wallet
                </Link>
              </li>
              <li>
                <Link href="/payment-plans" className="hover:text-white transition">
                  Payment Plans
                </Link>
              </li>
              <li>
                <Link href="/virtual-viewing" className="hover:text-white transition">
                  Virtual Viewing
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* For Landlords */}
          <div>
            <h4 className="font-semibold mb-4">For Landlords</h4>
            <ul className="space-y-2 text-sm text-primary-200">
              <li>
                <Link href="/list-property" className="hover:text-white transition">
                  List Property
                </Link>
              </li>
              <li>
                <Link href="/landlord-benefits" className="hover:text-white transition">
                  Benefits
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-white transition">
                  Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-primary-200">
          <p>&copy; {new Date().getFullYear()} GreenRent. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link href="/privacy" className="hover:text-white transition">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
