import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Trash2, Plus, LogOut } from 'lucide-react';
import { Loader } from '../components/ui/Loader';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

function AdminDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [beefs, setBeefs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        id: '',
        titleEn: '',
        titleHe: '',
        descriptionEn: '',
        descriptionHe: '',
        philosopherA: '', // ID string
        philosopherB: ''  // ID string
    });

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchBeefs();
    }, [user, navigate]);

    const fetchBeefs = async () => {
        try {
            const { data } = await axios.get(`${API_BASE_URL}/beefs`);
            setBeefs(data.beefs);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching beefs:", error);
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this beef?')) return;

        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            };
            await axios.delete(`${API_BASE_URL}/beefs/${id}`, config);
            fetchBeefs();
        } catch (error) {
            alert('Error deleting beef');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // First, we need to find the ObjectIds for the philosophers
            // For simplicity in this MVP, we'll assume the user enters the 'id' (slug) of the philosopher
            // and we'll let the backend handle the lookup or we'd need a dropdown here.
            // BUT, our backend expects ObjectIds for philosopherA/B.
            // To make this robust without a complex UI, let's fetch all philosophers first? 
            // Or better, let's update the backend to accept string IDs and look them up?
            // NO, let's stick to the plan. The seeder handles the complex stuff.
            // For the UI, let's just show the list for now and maybe a "Coming Soon" for the form
            // unless I implement a philosopher picker.

            // WAIT, the user asked to "upload beefs".
            // I'll implement a simple form that takes IDs. 
            // I will need to fetch the philosopher ObjectIds.

            // Let's do a quick lookup here.
            const philA = await axios.get(`${API_BASE_URL}/philosophers/${formData.philosopherA}`);
            const philB = await axios.get(`${API_BASE_URL}/philosophers/${formData.philosopherB}`);

            const payload = {
                ...formData,
                philosopherA: philA.data._id,
                philosopherB: philB.data._id
            };

            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            };

            await axios.post(`${API_BASE_URL}/beefs`, payload, config);
            setFormData({
                id: '', titleEn: '', titleHe: '', descriptionEn: '', descriptionHe: '', philosopherA: '', philosopherB: ''
            });
            fetchBeefs();
            alert('Beef added successfully!');
        } catch (error) {
            console.error(error);
            alert('Error adding beef. Ensure Philosopher IDs are correct.');
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-serif font-bold text-primary">Admin Dashboard</h1>
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                    >
                        <LogOut className="w-4 h-4" /> Logout
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Add Beef Form */}
                    <div className="bg-card p-6 rounded-xl border border-amber-500 h-fit">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-primary" /> Add New Beef
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                placeholder="ID (slug)"
                                value={formData.id}
                                onChange={e => setFormData({ ...formData, id: e.target.value })}
                                className="w-full bg-muted border border-input rounded p-2" required
                            />
                            <input
                                placeholder="Title (English)"
                                value={formData.titleEn}
                                onChange={e => setFormData({ ...formData, titleEn: e.target.value })}
                                className="w-full bg-muted border border-input rounded p-2" required
                            />
                            <input
                                placeholder="Title (Hebrew)"
                                value={formData.titleHe}
                                onChange={e => setFormData({ ...formData, titleHe: e.target.value })}
                                className="w-full bg-muted border border-input rounded p-2 text-right" required
                            />
                            <textarea
                                placeholder="Description (English)"
                                value={formData.descriptionEn}
                                onChange={e => setFormData({ ...formData, descriptionEn: e.target.value })}
                                className="w-full bg-muted border border-input rounded p-2"
                            />
                            <textarea
                                placeholder="Description (Hebrew)"
                                value={formData.descriptionHe}
                                onChange={e => setFormData({ ...formData, descriptionHe: e.target.value })}
                                className="w-full bg-muted border border-input rounded p-2 text-right"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    placeholder="Philosopher A ID"
                                    value={formData.philosopherA}
                                    onChange={e => setFormData({ ...formData, philosopherA: e.target.value })}
                                    className="w-full bg-muted border border-input rounded p-2" required
                                />
                                <input
                                    placeholder="Philosopher B ID"
                                    value={formData.philosopherB}
                                    onChange={e => setFormData({ ...formData, philosopherB: e.target.value })}
                                    className="w-full bg-muted border border-input rounded p-2" required
                                />
                            </div>
                            <button type="submit" className="w-full bg-primary hover:bg-primary/90 py-2 rounded font-bold text-primary-foreground">
                                Add Beef
                            </button>
                        </form>
                    </div>

                    {/* Beef List */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-xl font-bold mb-4">Existing Beefs</h2>
                        {loading ? <div className="py-10 flex justify-center"><Loader /></div> : beefs.map(beef => (
                            <div key={beef.id} className="bg-card p-4 rounded-xl border border-amber-500 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-lg">{beef.titleEn}</h3>
                                    <p className="text-sm text-muted-foreground">{beef.philosopherA?.nameEn} vs {beef.philosopherB?.nameEn}</p>
                                </div>
                                <button
                                    onClick={() => handleDelete(beef.id)}
                                    className="p-2 text-destructive hover:bg-destructive/20 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
