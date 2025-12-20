import React, { useState } from 'react';
import AdminLayout from '../components/AdminLayout';

const Billing = () => {
  const [activeTab, setActiveTab] = useState('Pending');

  const tabs = ['Pending', 'Confirmed', 'Archived'];

  const mockBillingData = [
    {
      id: 1,
      invoiceNumber: 'INV-2024-001',
      customerName: 'Rajesh Kumar',
      amount: 15000,
      status: 'Pending',
      dueDate: '2024-01-15',
      items: 5
    },
    {
      id: 2,
      invoiceNumber: 'INV-2024-002',
      customerName: 'Priya Sharma',
      amount: 8500,
      status: 'Confirmed',
      dueDate: '2024-01-10',
      items: 3
    }
  ];

  const filteredData = mockBillingData.filter(item => item.status === activeTab);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Billing Header */}
        <div className="card px-6 py-6">
          <div className="flex items-start space-x-4">
            <div className="bg-app-accent/10 p-3 rounded-pro">
              <svg className="w-6 h-6 text-app-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-app-main mb-2">Billing & Payments</h1>
              <p className="text-app-muted font-sans">
                Manage invoices, payments, and billing information
              </p>
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="card p-6">
          <div className="flex space-x-2 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-pro font-sans font-medium text-sm transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-app-accent text-white shadow-sm'
                    : 'text-app-main hover:text-app-accent hover:bg-app-secondary'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Billing List */}
          <div className="space-y-4">
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <div key={item.id} className="border border-app-border rounded-pro p-4 hover:border-app-accent/50 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="font-sans font-medium text-app-main">{item.invoiceNumber}</h3>
                        <span className={`px-2 py-1 text-xs rounded-pro font-sans ${
                          item.status === 'Confirmed' 
                            ? 'bg-green-100 text-green-800'
                            : item.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-sm text-app-muted font-sans mb-1">
                        Customer: {item.customerName}
                      </p>
                      <p className="text-sm text-app-muted font-sans">
                        Due: {item.dueDate} • Items: {item.items}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-sans font-semibold text-app-main">
                        ₹{item.amount.toLocaleString()}
                      </p>
                      <div className="flex space-x-2 mt-2">
                        <button className="px-3 py-1 text-xs bg-app-secondary text-app-main rounded-pro hover:bg-app-accent hover:text-white transition-colors duration-200">
                          View
                        </button>
                        <button className="px-3 py-1 text-xs bg-app-accent text-white rounded-pro hover:bg-app-accent/90 transition-colors duration-200">
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-app-muted font-sans">No {activeTab.toLowerCase()} billing records found</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-pro">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-app-muted font-sans">Total Pending</p>
                <p className="text-xl font-sans font-semibold text-app-main">₹15,000</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-pro">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-app-muted font-sans">Total Confirmed</p>
                <p className="text-xl font-sans font-semibold text-app-main">₹8,500</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-2 rounded-pro">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-app-muted font-sans">This Month</p>
                <p className="text-xl font-sans font-semibold text-app-main">₹23,500</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Billing;