import Link from 'next/link';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary-800 to-primary-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">How GreenRent Works</h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto">
            Your complete guide to finding affordable housing through flexible payments and smart saving
          </p>
        </div>
      </section>

      {/* Main Steps */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto space-y-24">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="flex-1">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6">
                  1
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Create Your Account</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Sign up for free in just minutes. Choose whether you're a tenant looking for a home or a landlord
                  with properties to list. Set up your rent wallet automatically and start your journey to affordable housing.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-3 text-xl">✓</span>
                    <span className="text-gray-700">Quick registration with email or phone</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-3 text-xl">✓</span>
                    <span className="text-gray-700">Automatic rent wallet creation</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-3 text-xl">✓</span>
                    <span className="text-gray-700">Profile verification for security</span>
                  </li>
                </ul>
                <Link
                  href="/auth/register"
                  className="inline-block mt-6 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  Get Started Free
                </Link>
              </div>
              <div className="flex-1">
                <div className="bg-primary-50 rounded-xl p-8 shadow-lg">
                  <div className="text-6xl mb-4 text-center">👤</div>
                  <div className="bg-white rounded-lg p-6 space-y-3">
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-10 bg-primary-600 rounded"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row-reverse gap-12 items-center">
              <div className="flex-1">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6">
                  2
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Start Saving with Rent Wallet</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Build your rent fund gradually with daily micro-savings. Save as little as KES 10 per day towards your rent.
                  Set up automatic savings or deposit manually whenever you can afford it.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-3 text-xl">✓</span>
                    <span className="text-gray-700">Minimum daily save: KES 10</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-3 text-xl">✓</span>
                    <span className="text-gray-700">Auto-save feature available</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-3 text-xl">✓</span>
                    <span className="text-gray-700">M-Pesa, cards, and bank transfers supported</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-3 text-xl">✓</span>
                    <span className="text-gray-700">Track your progress with savings goals</span>
                  </li>
                </ul>
              </div>
              <div className="flex-1">
                <div className="bg-primary-50 rounded-xl p-8 shadow-lg">
                  <div className="text-6xl mb-4 text-center">💰</div>
                  <div className="bg-white rounded-lg p-6">
                    <div className="text-center mb-4">
                      <div className="text-sm text-gray-500 mb-2">Wallet Balance</div>
                      <div className="text-4xl font-bold text-primary-600">KES 12,450</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Savings Goal</span>
                        <span className="font-semibold text-gray-900">KES 20,000</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-primary-600 h-2 rounded-full" style={{ width: '62%' }}></div>
                      </div>
                      <div className="text-xs text-gray-500 text-right">62% Complete</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="flex-1">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6">
                  3
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Browse & View Properties</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Explore our wide selection of quality rental properties. Use filters to find exactly what you need.
                  Schedule virtual or physical viewings to see your potential new home without any pressure.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-3 text-xl">✓</span>
                    <span className="text-gray-700">360° virtual tours available</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-3 text-xl">✓</span>
                    <span className="text-gray-700">High-quality photos and videos</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-3 text-xl">✓</span>
                    <span className="text-gray-700">Schedule viewings at your convenience</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-3 text-xl">✓</span>
                    <span className="text-gray-700">View from anywhere in the world</span>
                  </li>
                </ul>
              </div>
              <div className="flex-1">
                <div className="bg-primary-50 rounded-xl p-8 shadow-lg">
                  <div className="text-6xl mb-4 text-center">🎥</div>
                  <div className="bg-white rounded-lg overflow-hidden">
                    <div className="h-40 bg-gray-300 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                          <div className="w-0 h-0 border-l-8 border-l-primary-600 border-y-6 border-y-transparent ml-1"></div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col md:flex-row-reverse gap-12 items-center">
              <div className="flex-1">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6">
                  4
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Flexible Payment Plan</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Select a payment plan that matches your income schedule. Our AI analyzes your saving patterns to
                  recommend the best plan for you. Pay daily, weekly, bi-weekly, or monthly - it's your choice.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-3 text-xl">✓</span>
                    <span className="text-gray-700">AI-powered payment recommendations</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-3 text-xl">✓</span>
                    <span className="text-gray-700">Daily, weekly, or monthly options</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-3 text-xl">✓</span>
                    <span className="text-gray-700">Use wallet balance as deposit</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-3 text-xl">✓</span>
                    <span className="text-gray-700">Flexible terms that work for you</span>
                  </li>
                </ul>
              </div>
              <div className="flex-1">
                <div className="bg-primary-50 rounded-xl p-8 shadow-lg">
                  <div className="text-6xl mb-4 text-center">📅</div>
                  <div className="bg-white rounded-lg p-6 space-y-4">
                    <div className="border-2 border-primary-600 rounded-lg p-4 bg-primary-50">
                      <div className="font-semibold text-gray-900 mb-1">Recommended Plan</div>
                      <div className="text-2xl font-bold text-primary-600">Weekly Payments</div>
                      <div className="text-sm text-gray-600 mt-2">KES 5,000 per week</div>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Alternative: Daily</div>
                      <div className="font-semibold text-gray-900">KES 714 per day</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="flex-1">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6">
                  5
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Move In & Start Living</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Complete the booking process, sign the digital lease agreement, and move into your new home!
                  Continue making flexible payments according to your chosen plan and enjoy your living space.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-3 text-xl">✓</span>
                    <span className="text-gray-700">Digital lease signing</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-3 text-xl">✓</span>
                    <span className="text-gray-700">Automatic payment reminders</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-3 text-xl">✓</span>
                    <span className="text-gray-700">24/7 support and maintenance requests</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-3 text-xl">✓</span>
                    <span className="text-gray-700">Build your rental credit history</span>
                  </li>
                </ul>
              </div>
              <div className="flex-1">
                <div className="bg-primary-50 rounded-xl p-8 shadow-lg">
                  <div className="text-6xl mb-4 text-center">🏡</div>
                  <div className="bg-white rounded-lg p-6">
                    <div className="flex items-center justify-center mb-4">
                      <div className="text-6xl text-primary-600">✓</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-gray-900 mb-2">Booking Confirmed!</div>
                      <div className="text-sm text-gray-600">Welcome to your new home</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary-800 to-primary-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of tenants who have found affordable housing through GreenRent
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="bg-accent-500 hover:bg-accent-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition"
            >
              Create Free Account
            </Link>
            <Link
              href="/properties"
              className="bg-white text-primary-800 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-50 transition"
            >
              Browse Properties
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <details className="bg-white rounded-lg p-6 shadow-card">
                <summary className="font-semibold text-lg cursor-pointer text-gray-900">
                  What is the minimum amount I can save?
                </summary>
                <p className="mt-3 text-gray-600">
                  You can save as little as KES 10 per day in your rent wallet. There's no maximum limit!
                </p>
              </details>

              <details className="bg-white rounded-lg p-6 shadow-card">
                <summary className="font-semibold text-lg cursor-pointer text-gray-900">
                  How do flexible payment plans work?
                </summary>
                <p className="mt-3 text-gray-600">
                  You choose a payment frequency that matches your income - daily, weekly, bi-weekly, or monthly.
                  Our AI recommends the best plan based on your saving patterns.
                </p>
              </details>

              <details className="bg-white rounded-lg p-6 shadow-card">
                <summary className="font-semibold text-lg cursor-pointer text-gray-900">
                  Are virtual viewings really as good as physical ones?
                </summary>
                <p className="mt-3 text-gray-600">
                  Our 360° virtual tours give you a comprehensive view of the property. However, you can always
                  schedule a physical viewing before making your final decision.
                </p>
              </details>

              <details className="bg-white rounded-lg p-6 shadow-card">
                <summary className="font-semibold text-lg cursor-pointer text-gray-900">
                  Is my money safe in the rent wallet?
                </summary>
                <p className="mt-3 text-gray-600">
                  Absolutely! Your funds are held in secure, regulated financial institutions and can only be
                  used for rent payments or withdrawn to your account.
                </p>
              </details>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
