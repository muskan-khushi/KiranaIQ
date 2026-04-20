import { useState } from 'react';
import { MapPin, Store, Calendar, IndianRupee, Send } from 'lucide-react';
import ImageUploadZone from './ImageUploadZone';

interface FormData {
  lat: number;
  lng: number;
  shop_size_sqft: string;
  years_in_operation: string;
  monthly_rent: string;
}

export default function AssessmentForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [formData, setFormData] = useState<FormData>({
    lat: 25.611, // Defaulting to Patna for the demo!
    lng: 85.144,
    shop_size_sqft: '',
    years_in_operation: '',
    monthly_rent: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length < 3) {
      alert("Please upload at least 3 images.");
      return;
    }
    
    setIsSubmitting(true);
    // Here is where you and Rupali will eventually wire up the API call:
    // await submitAssessment(formData, images);
    
    setTimeout(() => {
      setIsSubmitting(false);
      alert("Demo Assessment Submitted! Redirecting to tracking...");
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-surface border border-border p-8 rounded-2xl shadow-aesthetic">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary mb-2">New Store Assessment</h2>
        <p className="text-muted text-sm">Upload store images and context to run the KiranaIQ underwriting engine.</p>
      </div>

      {/* Required Uploads */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="bg-primary text-surface w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span> 
          Visual Intelligence (Required)
        </h3>
        <ImageUploadZone onImagesChange={setImages} />
      </div>

      {/* Geo Capture (Simulated) */}
      <div className="mb-8 bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-surface rounded-full text-primary shadow-sm"><MapPin size={20} /></div>
          <div>
            <p className="text-sm font-semibold text-primary">GPS Location Captured</p>
            <p className="text-xs text-muted">Lat: {formData.lat}, Lng: {formData.lng} (Accuracy: 4m)</p>
          </div>
        </div>
        <span className="text-xs font-medium bg-success/10 text-success px-2 py-1 rounded-md">Verified</span>
      </div>

      {/* Optional Metadata */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="bg-primary text-surface w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span> 
          Store Metadata (Optional, boosts accuracy)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input 
              type="number" name="shop_size_sqft" placeholder="Size (Sq Ft)"
              value={formData.shop_size_sqft} onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input 
              type="number" name="years_in_operation" placeholder="Years in Operation"
              value={formData.years_in_operation} onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
            />
          </div>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input 
              type="number" name="monthly_rent" placeholder="Monthly Rent"
              value={formData.monthly_rent} onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
            />
          </div>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full bg-primary text-surface py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-70"
      >
        {isSubmitting ? 'Analyzing Store...' : 'Run Assessment Pipeline'}
        {!isSubmitting && <Send size={18} />}
      </button>
    </form>
  );
}