"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { adminSidebarItems } from '../page';

export default function SupportPage() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, open, in_progress, closed

  useEffect(() => {
    if (session) {
      fetchTickets();
    }
  }, [session, filter]);

  const fetchTickets = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/support/tickets/?status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch support tickets');
      const data = await response.json();
      setTickets(data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (ticketId) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/support/tickets/${ticketId}/`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch ticket details');
      const data = await response.json();
      setSelectedTicket(data);
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      setError(error.message);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/support/tickets/${selectedTicket.id}/messages/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ content: newMessage }),
      });

      if (!response.ok) throw new Error('Failed to send message');
      setNewMessage('');
      fetchTicketDetails(selectedTicket.id);
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.message);
    }
  };

  const updateTicketStatus = async (ticketId, status) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/support/tickets/${ticketId}/update_status/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Failed to update ticket status');
      fetchTickets();
      if (selectedTicket && selectedTicket.id === ticketId) {
        fetchTicketDetails(ticketId);
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      setError(error.message);
    }
  };

  if (!session || loading) return <div className="text-center p-4">Loading...</div>;

  return (
    <DashboardLayout sidebarItems={adminSidebarItems}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Support Management</h1>
          <div className="space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="all">All Tickets</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200 mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium">Support Tickets</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {tickets.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No support tickets found
                </div>
              ) : (
                tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => fetchTicketDetails(ticket.id)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                      selectedTicket?.id === ticket.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium truncate">{ticket.title}</p>
                        <p className="text-sm text-gray-500 truncate">
                          {ticket.user?.name} ({ticket.user?.email})
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <span className={`px-2 py-1 text-xs rounded-full
                          ${ticket.status === 'open' ? 'bg-green-100 text-green-800' :
                          ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'}`}
                        >
                          {ticket.status}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full
                          ${ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'}`}
                        >
                          {ticket.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Ticket Details */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow">
            {selectedTicket ? (
              <>
                <div className="p-4 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-medium">{selectedTicket.title}</h2>
                      <p className="text-sm text-gray-500 mt-1">{selectedTicket.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm text-gray-500">
                          From: {selectedTicket.user?.name} ({selectedTicket.user?.email})
                        </span>
                        <span className="text-sm text-gray-500">
                          Created: {new Date(selectedTicket.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full
                        ${selectedTicket.status === 'open' ? 'bg-green-100 text-green-800' :
                        selectedTicket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'}`}
                      >
                        {selectedTicket.status}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full
                        ${selectedTicket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        selectedTicket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        selectedTicket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'}`}
                      >
                        {selectedTicket.priority}
                      </span>
                      {selectedTicket.status !== 'closed' && (
                        <select
                          value={selectedTicket.status}
                          onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value)}
                          className="p-1 border rounded text-sm"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="closed">Closed</option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col h-96">
                  <div className="flex-1 p-4 overflow-y-auto">
                    {selectedTicket.messages?.map((message) => (
                      <div
                        key={message.id}
                        className={`mb-4 flex ${message.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            message.sender === 'admin'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p>{message.content}</p>
                          <p className="text-xs mt-1 opacity-75">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedTicket.status !== 'closed' && (
                    <div className="p-4 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          placeholder="Type your response..."
                          className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={sendMessage}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-96 text-gray-500">
                Select a ticket to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
