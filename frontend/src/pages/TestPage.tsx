import React from 'react';

/**
 * Simple test page to verify React and Tailwind CSS are working
 * Navigate to /test to see this page
 */
const TestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ✅ React is Working!
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            If you can see this page with colors and styling, then:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>✅ React is rendering correctly</li>
            <li>✅ Tailwind CSS is compiled and loaded</li>
            <li>✅ Routing is working</li>
            <li>✅ TypeScript is compiling</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-blue-100 border-2 border-blue-500 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-blue-900 mb-2">
              Blue Card
            </h2>
            <p className="text-blue-700">
              This card tests Tailwind color utilities
            </p>
          </div>

          <div className="bg-green-100 border-2 border-green-500 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-green-900 mb-2">
              Green Card
            </h2>
            <p className="text-green-700">
              This card tests Tailwind layout utilities
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Interactive Elements
          </h2>
          <div className="space-y-4">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Primary Button
            </button>
            <button className="ml-4 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">
              Secondary Button
            </button>
            <div className="mt-4">
              <input
                type="text"
                placeholder="Test input field"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            ⚠️ If you see this page but other pages are empty:
          </h3>
          <ul className="list-disc list-inside space-y-1 text-yellow-800">
            <li>Check browser console for JavaScript errors (F12)</li>
            <li>Verify backend is running (http://localhost:5000/health)</li>
            <li>Try logging in and creating a mess first</li>
            <li>Check that you're logged in (look for user menu in navbar)</li>
            <li>Some pages show "No data" messages when empty - this is normal!</li>
          </ul>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Navigation Test
          </h2>
          <p className="text-gray-600 mb-4">
            Try navigating to these pages:
          </p>
          <div className="space-y-2">
            <a href="/login" className="block text-blue-600 hover:underline">
              → /login - Login Page
            </a>
            <a href="/register" className="block text-blue-600 hover:underline">
              → /register - Register Page
            </a>
            <a href="/dashboard" className="block text-blue-600 hover:underline">
              → /dashboard - Dashboard (requires login)
            </a>
            <a href="/messes" className="block text-blue-600 hover:underline">
              → /messes - Messes Page (requires login)
            </a>
            <a href="/expenses" className="block text-blue-600 hover:underline">
              → /expenses - Expenses Page (requires login)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
