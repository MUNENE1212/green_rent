import Link from 'next/link';

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
              Welcome to <span className="text-accent-300">GreenRent</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Your path to affordable housing starts here. Save daily, pay flexibly, and find your perfect home.
            </p>
            <p className="text-lg mb-12 text-primary-200 max-w-2xl mx-auto">
              AI-powered flexible payment plans with daily micro-savings (as low as KES 10) and virtual property viewing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/properties"
                className="bg-accent-500 hover:bg-accent-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
              >
                Browse Properties
              </Link>
              <Link
                href="/auth/register"
                className="bg-white text-primary-800 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-50 transition-all transform hover:scale-105 shadow-lg"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
            Why Choose GreenRent?
          </h2>
          <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto">
            We're revolutionizing the rental market with innovative features designed for financial inclusion
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-card hover:shadow-card-hover transition-all transform hover:-translate-y-1">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">💰</span>
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-primary-800">Rent Wallet</h3>
              <p className="text-gray-600 mb-4">
                Save towards rent with micro-deposits as low as KES 10 per day. Build your rent fund gradually and pay when ready.
              </p>
              <Link href="/wallet" className="text-primary-600 font-semibold hover:text-primary-700">
                Learn more →
              </Link>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-card hover:shadow-card-hover transition-all transform hover:-translate-y-1">
              <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">📅</span>
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-primary-800">Flexible Payments</h3>
              <p className="text-gray-600 mb-4">
                Choose your payment frequency: daily, weekly, bi-weekly, or monthly. AI-powered plans tailored to your income.
              </p>
              <Link href="/payment-plans" className="text-primary-600 font-semibold hover:text-primary-700">
                Explore plans →
              </Link>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-card hover:shadow-card-hover transition-all transform hover:-translate-y-1">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">🎥</span>
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-primary-800">Virtual Viewing</h3>
              <p className="text-gray-600 mb-4">
                View properties from anywhere with 360° tours, video walkthroughs, and comprehensive photo galleries.
              </p>
              <Link href="/properties" className="text-primary-600 font-semibold hover:text-primary-700">
                View properties →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
            How It Works
          </h2>
          <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto">
            Get started in just three simple steps
          </p>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Sign Up</h3>
                <p className="text-gray-600">
                  Create your free account and set up your rent wallet in minutes
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-primary-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Find & Book</h3>
                <p className="text-gray-600">
                  Browse properties, schedule virtual viewings, and book your dream home
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-primary-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Move In</h3>
                <p className="text-gray-600">
                  Set up flexible payments and move into your new home with confidence
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-800 to-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Find Your Perfect Home?
          </h2>
          <p className="text-xl mb-8 text-primary-100 max-w-2xl mx-auto">
            Join thousands of tenants who are already saving towards their rent with GreenRent
          </p>
          <Link
            href="/auth/register"
            className="inline-block bg-accent-500 hover:bg-accent-600 text-white px-10 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
          >
            Start Saving Today
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">1000+</div>
              <div className="text-gray-600">Available Properties</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">5000+</div>
              <div className="text-gray-600">Happy Tenants</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">KES 10</div>
              <div className="text-gray-600">Minimum Daily Save</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">100%</div>
              <div className="text-gray-600">Secure Payments</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
