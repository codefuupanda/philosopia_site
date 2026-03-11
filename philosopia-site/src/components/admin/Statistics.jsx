import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, BookOpen, Scale, Lightbulb, TrendingUp, Eye } from 'lucide-react';
import { Loader } from '../ui/Loader';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

function Statistics() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [philosophers, schools, concepts, beefs] = await Promise.all([
                axios.get(`${API_BASE_URL}/philosophers?limit=999`),
                axios.get(`${API_BASE_URL}/schools`),
                axios.get(`${API_BASE_URL}/concepts`),
                axios.get(`${API_BASE_URL}/beefs`),
            ]);

            setStats({
                philosophers: philosophers.data.philosophers?.length || philosophers.data.length || 0,
                schools: schools.data.schools?.length || schools.data.length || 0,
                concepts: concepts.data.concepts?.length || concepts.data.length || 0,
                beefs: beefs.data.beefs?.length || beefs.data.length || 0,
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="py-20 flex justify-center"><Loader /></div>;
    }

    const cards = [
        { label: "Philosophers", value: stats?.philosophers ?? 0, icon: Users, color: "text-blue-500" },
        { label: "Schools", value: stats?.schools ?? 0, icon: BookOpen, color: "text-green-500" },
        { label: "Concepts", value: stats?.concepts ?? 0, icon: Lightbulb, color: "text-yellow-500" },
        { label: "Beefs", value: stats?.beefs ?? 0, icon: Scale, color: "text-red-500" },
    ];

    const popularPages = [
        { page: "Philosophers", path: "/en/philosophers", views: "—" },
        { page: "Schools", path: "/en/schools", views: "—" },
        { page: "Concepts", path: "/en/concepts", views: "—" },
        { page: "Beefs", path: "/en/beefs", views: "—" },
        { page: "Art & Philosophy", path: "/en/art-and-philo", views: "—" },
    ];

    return (
        <div className="space-y-8">
            {/* Overview Cards */}
            <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" /> Overview
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {cards.map((card) => {
                        const Icon = card.icon;
                        return (
                            <div key={card.label} className="bg-card p-6 rounded-xl border border-amber-500 text-center">
                                <Icon className={`w-8 h-8 mx-auto mb-2 ${card.color}`} />
                                <div className="text-3xl font-bold text-foreground">{card.value}</div>
                                <div className="text-sm text-muted-foreground mt-1">{card.label}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Popular Pages */}
            <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-primary" /> Popular Pages
                </h2>
                <div className="bg-card rounded-xl border border-amber-500 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left p-4 text-sm font-bold text-muted-foreground">Page</th>
                                <th className="text-left p-4 text-sm font-bold text-muted-foreground">Path</th>
                                <th className="text-right p-4 text-sm font-bold text-muted-foreground">Views</th>
                            </tr>
                        </thead>
                        <tbody>
                            {popularPages.map((page) => (
                                <tr key={page.path} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                                    <td className="p-4 font-medium text-foreground">{page.page}</td>
                                    <td className="p-4 text-sm text-muted-foreground font-mono">{page.path}</td>
                                    <td className="p-4 text-right text-sm text-muted-foreground">{page.views}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    * Page view tracking coming soon. Connect analytics to see real data.
                </p>
            </div>
        </div>
    );
}

export default Statistics;
