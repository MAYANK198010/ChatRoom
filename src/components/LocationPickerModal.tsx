import React, { useState } from 'react';
import { MapPin, X, Send, Navigation, Compass, Check } from 'lucide-react';
import { LocationData } from '../types';

interface LocationPickerModalProps {
  onSend: (location: LocationData) => void;
  onClose: () => void;
}

const PRESET_PLACES = [
  { name: 'Current GPS Location', address: 'Near Market St, San Francisco, CA', lat: 37.7749, lng: -122.4194 },
  { name: 'Apple Park Visitor Center', address: '10600 N Tantau Ave, Cupertino, CA', lat: 37.3346, lng: -122.0090 },
  { name: 'Googleplex HQ', address: '1600 Amphitheatre Pkwy, Mountain View, CA', lat: 37.4220, lng: -122.0841 },
  { name: 'Ferry Building Marketplace', address: '1 Ferry Building, The Embarcadero, SF', lat: 37.7955, lng: -122.3937 }
];

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({ onSend, onClose }) => {
  const [selectedPlace, setSelectedPlace] = useState(PRESET_PLACES[0]);
  const [isLocating, setIsLocating] = useState(false);

  const fetchLiveGPS = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          const live = {
            name: 'Live GPS Location',
            address: `Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          setSelectedPlace(live);
        },
        () => {
          setIsLocating(false);
        }
      );
    }
  };

  const handleSend = () => {
    onSend({
      latitude: selectedPlace.lat,
      longitude: selectedPlace.lng,
      name: selectedPlace.name,
      address: selectedPlace.address
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none text-[#1c1e21] font-sans">
      <div className="bg-white border border-[#e4e6eb] rounded-3xl overflow-hidden w-full max-w-md shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-[#e4e6eb] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-50 text-[#0084ff] rounded-xl flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base">Share Location</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map Preview Simulator */}
        <div className="relative h-44 bg-slate-100 overflow-hidden flex items-center justify-center border-b border-[#e4e6eb]">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: 'radial-gradient(#0084ff 1px, transparent 1px)',
              backgroundSize: '18px 18px'
            }}
          />

          <div className="absolute w-28 h-28 rounded-full border border-blue-400/40 animate-ping opacity-40" />

          {/* Central Pin */}
          <div className="relative z-10 flex flex-col items-center animate-bounce">
            <div className="p-2.5 bg-[#0084ff] text-white rounded-2xl shadow-lg">
              <MapPin className="w-5 h-5 fill-current" />
            </div>
          </div>

          {/* GPS Button */}
          <button
            onClick={fetchLiveGPS}
            className="absolute bottom-3 right-3 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-[#0084ff] rounded-xl shadow-sm transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Locating...' : 'Get GPS'}</span>
          </button>
        </div>

        {/* Places List */}
        <div className="p-3 space-y-1 max-h-52 overflow-y-auto">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
            Nearby Places
          </div>
          {PRESET_PLACES.map((place, idx) => {
            const isSelected = selectedPlace.name === place.name;
            return (
              <button
                key={idx}
                onClick={() => setSelectedPlace(place)}
                className={`w-full text-left p-2.5 rounded-2xl transition flex items-center justify-between cursor-pointer ${
                  isSelected ? 'bg-blue-50 text-[#0084ff]' : 'hover:bg-[#f0f2f5] text-[#1c1e21]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white border border-gray-200 text-[#0084ff] rounded-xl shadow-2xs">
                    <Navigation className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">{place.name}</div>
                    <div className="text-[11px] text-gray-500 truncate max-w-[240px]">{place.address}</div>
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#0084ff]" />}
              </button>
            );
          })}
        </div>

        {/* Footer Action */}
        <div className="p-4 bg-[#fafafa] border-t border-[#e4e6eb] flex items-center justify-end">
          <button
            onClick={handleSend}
            className="px-5 py-2.5 bg-[#0084ff] hover:bg-[#0073e6] text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-blue-100 transition cursor-pointer"
          >
            <span>Send Location</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
