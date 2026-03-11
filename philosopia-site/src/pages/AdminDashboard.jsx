import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Scale, BarChart3 } from 'lucide-react';
import BeefManager from '../components/admin/BeefManager';
import Statistics from '../components/admin/Statistics';

const tabs = [
    { id: 'statistics', label: 'Statistics', icon: BarChart3 },
    { id: 'beefs', label: 'Manage Beefs', icon: Scale },
];

function AdminDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('statistics');

    useEffect(() => {
        // TODO: re-enable auth guard
        if (!user) {
            navigate('/login');
            return;
        }
    }, [user, navigate]);

    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-serif font-bold text-primary">Admin Dashboard</h1>
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                    >
                        <LogOut className="w-4 h-4" /> Logout
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-8 border-b border-border">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                                    activeTab === tab.id
                                        ? 'border-amber-500 text-amber-500'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                {activeTab === 'statistics' && <Statistics />}
                {activeTab === 'beefs' && <BeefManager />}
            </div>
        </div>
    );
}

export default AdminDashboard;
