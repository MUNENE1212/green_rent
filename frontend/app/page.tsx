export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🏡 Welcome to <span className="text-primary-600">GreenRent</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            AI-Powered Flexible Rental Management Platform with Financial Inclusion
          </p>

          <div className="grid md:grid-cols-3 gap-8 mt-16 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-card hover:shadow-card-hover transition-shadow">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-2">Rent Wallet</h3>
              <p className="text-gray-600">
                Save daily micro-amounts (as low as KES 10) towards your rent
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-card hover:shadow-card-hover transition-shadow">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-xl font-semibold mb-2">Flexible Payments</h3>
              <p className="text-gray-600">
                Pay daily, weekly, bi-weekly, or monthly - your choice
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-card hover:shadow-card-hover transition-shadow">
              <div className="text-4xl mb-4">🎥</div>
              <h3 className="text-xl font-semibold mb-2">Virtual Viewing</h3>
              <p className="text-gray-600">
                View properties remotely with 360° tours and videos
              </p>
            </div>
          </div>

          <div className="mt-16 space-x-4">
            <button className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
              Find a Home
            </button>
            <button className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold border-2 border-primary-600 hover:bg-primary-50 transition-colors">
              List Property
            </button>
          </div>

          <div className="mt-16 p-6 bg-primary-50 rounded-lg max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              🚀 Application Status
            </h2>
            <div className="space-y-2 text-left">
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✅</span>
                <span>Backend API initialized</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✅</span>
                <span>Frontend Next.js setup complete</span>
              </div>
              <div className="flex items-center">
                <span className="text-yellow-600 mr-2">⏳</span>
                <span>Database models pending</span>
              </div>
              <div className="flex items-center">
                <span className="text-yellow-600 mr-2">⏳</span>
                <span>Authentication system pending</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
