import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, User, Phone, Building2, FileText, Camera, ArrowRight, AlertCircle, CheckCircle2, MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Register() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "+974", password: "", confirmPassword: "",
    accountType: "personal", companyName: "", commercialRegister: "",
    agreeTerms: false,
  });
  const [idPhoto, setIdPhoto] = useState(null);
  const [idPhotoPreview, setIdPhotoPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState("");
  const [locationSkipped, setLocationSkipped] = useState(false);