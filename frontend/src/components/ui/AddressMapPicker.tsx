"use client";

import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Loader2 } from "lucide-react";

interface AddressMapPickerProps {
  value: string;
  onChange: (address: string) => void;
  label?: string;
}

declare global {
  interface Window {
    L: any;
  }
}

export function AddressMapPicker({ value, onChange, label = "Adresse" }: AddressMapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  // Default coordinates (Tunis center)
  const defaultLat = 36.8065;
  const defaultLng = 10.1815;

  // Load Leaflet CSS and JS dynamically from CDN
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.L) {
      setMapLoaded(true);
      return;
    }

    // Load Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    if (!document.getElementById("leaflet-js")) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => {
        setMapLoaded(true);
      };
      document.head.appendChild(script);
    } else {
      const checkL = setInterval(() => {
        if (window.L) {
          setMapLoaded(true);
          clearInterval(checkL);
        }
      }, 100);
    }
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || leafletInstance.current) return;

    const L = window.L;
    if (!L) return;

    // Create Leaflet Map
    const map = L.map(mapRef.current).setView([defaultLat, defaultLng], 12);
    leafletInstance.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Custom Red Icon for marker
    const customIcon = L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    // Add marker on map click
    map.on("click", async (e: any) => {
      const { lat, lng } = e.latlng;
      updateMarker(lat, lng, customIcon);
      await reverseGeocode(lat, lng);
    });

    // If initial value exists, try geocoding it to position marker
    if (value && value.trim().length > 3) {
      geocodeAddress(value, false);
    }

    // Fix map render sizing issue when inside modals
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      if (leafletInstance.current) {
        leafletInstance.current.remove();
        leafletInstance.current = null;
      }
    };
  }, [mapLoaded]);

  // Update marker position
  const updateMarker = (lat: number, lng: number, customIcon?: any) => {
    const L = window.L;
    if (!L || !leafletInstance.current) return;

    const icon = customIcon || L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    if (markerInstance.current) {
      markerInstance.current.setLatLng([lat, lng]);
    } else {
      markerInstance.current = L.marker([lat, lng], { icon }).addTo(leafletInstance.current);
    }

    leafletInstance.current.setView([lat, lng], 15);
  };

  // Reverse Geocode (Coordinates -> Address Text)
  const reverseGeocode = async (lat: number, lng: number) => {
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "fr",
          },
        }
      );
      const data = await res.json();
      if (data && data.display_name) {
        const formattedAddress = data.display_name;
        onChange(formattedAddress);
      }
    } catch (err) {
      console.error("Erreur de géocodage inversé:", err);
    } finally {
      setGeocoding(false);
    }
  };

  // Forward Geocode (Address Text -> Coordinates)
  const geocodeAddress = async (query: string, panOnly = true) => {
    if (!query || query.trim().length < 2) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        {
          headers: {
            "Accept-Language": "fr",
          },
        }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        updateMarker(lat, lon);
        if (!panOnly) {
          onChange(data[0].display_name);
        }
      }
    } catch (err) {
      console.error("Erreur de recherche d'adresse:", err);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    geocodeAddress(searchQuery || value, false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span>{label}</span>
          {geocoding && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1 ml-2">
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
              Récupération de l'adresse...
            </span>
          )}
        </label>
        <span className="text-[10px] text-muted-foreground">Cliquez sur la carte pour choisir l'emplacement</span>
      </div>

      {/* Text Input for Address */}
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          placeholder="Ex: Avenue Habib Bourguiba, Tunis..."
          className="text-xs h-9"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => geocodeAddress(value, true)}
          disabled={searching || !value}
          className="h-9 px-3 text-xs shrink-0"
          title="Placer le marqueur à cette adresse"
        >
          {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
        </Button>
      </div>

      {/* Map Container */}
      <div className="relative border rounded-xl overflow-hidden shadow-2xs">
        <div ref={mapRef} className="w-full h-44 z-0 bg-muted/20" />

        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 text-xs text-muted-foreground gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>Chargement de la carte...</span>
          </div>
        )}
      </div>
    </div>
  );
}
