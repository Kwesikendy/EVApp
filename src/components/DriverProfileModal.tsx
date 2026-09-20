import React, { useState, useRef } from 'react';
import {
  User,
  Car,
  Camera,
  Upload,
  Plus,
  Trash2,
  Check,
  X,
  ShieldCheck,
  Smartphone,
  Sliders,
  Bell,
  Mail,
  Phone,
  Building2,
  Download,
  LogOut,
  Sparkles,
  CreditCard,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MtnMomoLogo, TelecelLogo, MastercardLogo } from './PaymentLogos';

export interface VehicleRecord {
  id: string;
  make: string;
  model: string;
  year: number;
  batteryCapacityKwh: number;
  connectorType: string;
  licensePlate: string;
  isDefault?: boolean;
}

export interface DriverProfileData {
  id: string;
  phoneNumber: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  ghanaCardId?: string;
  walletBalance?: number;
  defaultPaymentMethod?: 'MTN_MOMO' | 'TELECEL_CASH' | 'MASTERCARD';
  targetChargeLimit?: number;
  smsReceiptsEnabled?: boolean;
  registeredVehicles?: VehicleRecord[];
}

interface DriverProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: DriverProfileData | null;
  activeVehicle: string;
  onSelectVehicle: (vehicleName: string) => void;
  onUpdateUser: (updated: DriverProfileData) => void;
  onOpenAdmin?: () => void;
  onSignOut?: () => void;
}

// Preset luxury automotive avatar options
const AVATAR_PRESETS = [
  { id: 'pilot-01', label: 'Sport', gradient: 'from-cyan-500 to-blue-600', icon: '⚡' },
  { id: 'pilot-02', label: 'Tech', gradient: 'from-emerald-500 to-teal-600', icon: '🔋' },
  { id: 'pilot-03', label: 'Fleet', gradient: 'from-amber-500 to-orange-600', icon: '🚛' },
  { id: 'pilot-04', label: 'Nordic', gradient: 'from-purple-500 to-indigo-600', icon: '🛡️' },
];

export const DriverProfileModal: React.FC<DriverProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  activeVehicle,
  onSelectVehicle,
  onUpdateUser,
  onOpenAdmin,
  onSignOut,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'vehicles' | 'preferences'>('info');

  // Form State
  const [displayName, setDisplayName] = useState(user?.displayName || 'Kofi Mensah');
  const [email, setEmail] = useState(user?.email || 'kofi.mensah@xcharge.africa');
  const [ghanaCardId, setGhanaCardId] = useState(user?.ghanaCardId || 'GHA-729104821-4');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user?.avatarUrl);
  const [paymentMethod, setPaymentMethod] = useState<'MTN_MOMO' | 'TELECEL_CASH' | 'MASTERCARD'>(
    user?.defaultPaymentMethod || 'MTN_MOMO'
  );
  const [targetChargeLimit, setTargetChargeLimit] = useState<number>(user?.targetChargeLimit || 80);
  const [smsReceipts, setSmsReceipts] = useState<boolean>(user?.smsReceiptsEnabled !== false);

  // Vehicles state
  const [vehicles, setVehicles] = useState<VehicleRecord[]>(
    user?.registeredVehicles && user.registeredVehicles.length > 0
      ? user.registeredVehicles
      : [
          {
            id: 'veh-01',
            make: 'BYD',
            model: 'Atto 3 EV',
            year: 2024,
            batteryCapacityKwh: 60.5,
            connectorType: 'CCS2',
            licensePlate: 'GW 4821 - 24',
            isDefault: true,
          },
          {
            id: 'veh-02',
            make: 'Tesla',
            model: 'Model Y Long Range',
            year: 2023,
            batteryCapacityKwh: 75.0,
            connectorType: 'CCS2',
            licensePlate: 'ER 1904 - 23',
            isDefault: false,
          },
        ]
  );

  // Add Vehicle Form State
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [newMake, setNewMake] = useState('Polestar');
  const [newModel, setNewModel] = useState('3 Performance');
  const [newYear, setNewYear] = useState('2024');
  const [newKwh, setNewKwh] = useState('111');
  const [newConnector, setNewConnector] = useState('CCS2');
  const [newPlate, setNewPlate] = useState('GE 5910 - 24');

  const [isSaving, setIsSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (under 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Add new vehicle to garage
  const handleAddVehicle = () => {
    if (!newMake || !newModel) return;

    const newVeh: VehicleRecord = {
      id: `veh-${Date.now()}`,
      make: newMake.trim(),
      model: newModel.trim(),
      year: parseInt(newYear, 10) || 2024,
      batteryCapacityKwh: parseFloat(newKwh) || 75,
      connectorType: newConnector,
      licensePlate: newPlate.trim() || 'GW 1000 - 24',
      isDefault: false,
    };

    const updatedList = [...vehicles, newVeh];
    setVehicles(updatedList);
    setIsAddingVehicle(false);
    onSelectVehicle(`${newVeh.make} ${newVeh.model}`);
  };

  // Save All Changes
  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveNotice(null);

    const updated: DriverProfileData = {
      ...user,
      id: user?.id || 'usr-gh-001',
      phoneNumber: user?.phoneNumber || '+233248901204',
      displayName: displayName.trim(),
      email: email.trim(),
      ghanaCardId: ghanaCardId.trim(),
      avatarUrl,
      defaultPaymentMethod: paymentMethod,
      targetChargeLimit,
      smsReceiptsEnabled: smsReceipts,
      registeredVehicles: vehicles,
    };

    // Update parent state and localStorage
    onUpdateUser(updated);

    // Sync with backend API
    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (e) {
      console.warn('Backend sync error:', e);
    }

    setIsSaving(false);
    setSaveNotice('Profile settings saved successfully');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 select-none"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 35, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 25, scale: 0.96 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="w-full max-w-lg max-h-[92vh] bg-[#10141a] border border-white/10 rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl"
        >
          {/* 1. Modal Top Bar */}
          <div className="p-4 sm:p-5 bg-[#141820] border-b border-white/[0.08] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center text-[#00f0ff]">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">
                  Driver Account & Settings
                </h3>
                <p className="text-[11px] text-[#94a3b8] font-mono">
                  {user?.phoneNumber || '+233 24 890 1204'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#181c24] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 2. Navigation Tabs */}
          <div className="flex items-center px-4 pt-3 bg-[#10141a] border-b border-white/[0.06] shrink-0 gap-2">
            {[
              { key: 'info', label: 'Personal Info', icon: User },
              { key: 'vehicles', label: 'My Garage', icon: Car },
              { key: 'preferences', label: 'Preferences', icon: Sliders },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 transition-all relative cursor-pointer ${
                    isActive ? 'text-[#00f0ff]' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="profileModalTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00f0ff] rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* 3. Tab Content Area (Scrollable) */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-5 space-y-4 text-xs">
            {saveNotice && (
              <div className="p-2.5 rounded-xl bg-[#00e699]/10 border border-[#00e699]/30 text-[#00e699] text-xs font-mono font-medium flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4" />
                <span>{saveNotice}</span>
              </div>
            )}

            {/* TAB 1: Personal Info & Avatar */}
            {activeTab === 'info' && (
              <div className="space-y-4 animate-in fade-in">
                {/* Avatar Uploader Section */}
                <div className="p-4 rounded-2xl bg-[#141820] border border-white/[0.08] flex items-center gap-4">
                  <div className="relative group shrink-0">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="w-16 h-16 rounded-full object-cover border-2 border-[#00f0ff] shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#181c24] to-[#222936] border-2 border-[#00f0ff]/50 flex items-center justify-center text-[#00f0ff] font-bold text-xl font-mono shadow-md">
                        {displayName.charAt(0) || 'K'}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Upload Profile Picture"
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#00f0ff] hover:bg-[#33f3ff] text-[#0a0e14] flex items-center justify-center shadow-lg transition-transform active:scale-90 cursor-pointer"
                    >
                      <Camera className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />

                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Driver Avatar</span>
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setAvatarUrl(undefined)}
                          className="text-[10px] text-red-400 hover:underline cursor-pointer"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-[#94a3b8]">
                      Upload your portrait or choose a vehicle pilot avatar preset below.
                    </p>

                    {/* Presets Row */}
                    <div className="flex items-center gap-1.5 pt-1">
                      {AVATAR_PRESETS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            // Generate high-resolution SVG data URI for the chosen pilot avatar
                            const svgPreset = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23181c24" stroke="%2300f0ff" stroke-width="4"/><text x="50" y="58" font-size="34" text-anchor="middle" dominant-baseline="middle">${p.icon}</text></svg>`;
                            setAvatarUrl(svgPreset);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-[#181c24] hover:bg-[#20252e] border border-white/10 text-[10px] text-slate-300 flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <span>{p.icon}</span>
                          <span>{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                      Full Name
                    </label>
                    <div className="flex items-center gap-2 bg-[#141820] border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-[#00f0ff] transition-all">
                      <User className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Driver Full Name"
                        className="flex-1 bg-transparent border-none text-white text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                      Phone Number (Ghana Mobile)
                    </label>
                    <div className="flex items-center gap-2 bg-[#141820] border border-white/10 rounded-xl px-3 py-2.5 opacity-80">
                      <span className="text-base leading-none">🇬🇭</span>
                      <span className="text-xs font-mono font-bold text-slate-300">+233</span>
                      <input
                        type="text"
                        disabled
                        value={user?.phoneNumber?.replace('+233', '') || '248901204'}
                        className="flex-1 bg-transparent border-none text-slate-300 font-mono text-xs focus:outline-none cursor-not-allowed"
                      />
                      <ShieldCheck className="w-4 h-4 text-[#00e699]" />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                      Phone number verified with Moolre SMS gateway
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                      Email Address (Charging Receipts)
                    </label>
                    <div className="flex items-center gap-2 bg-[#141820] border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-[#00f0ff] transition-all">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="driver@xcharge.africa"
                        className="flex-1 bg-transparent border-none text-white text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                      Ghana Card PIN / Driver ID
                    </label>
                    <div className="flex items-center gap-2 bg-[#141820] border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-[#00f0ff] transition-all">
                      <CreditCard className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={ghanaCardId}
                        onChange={(e) => setGhanaCardId(e.target.value)}
                        placeholder="GHA-XXXXXXXXX-X"
                        className="flex-1 bg-transparent border-none text-white font-mono text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: My Garage & Vehicles */}
            {activeTab === 'vehicles' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Registered Fleet & Garage</h4>
                    <p className="text-[11px] text-[#94a3b8]">Select active vehicle profile for charging telemetry.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddingVehicle(!isAddingVehicle)}
                    className="px-2.5 py-1.5 rounded-xl bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 border border-[#00f0ff]/30 text-[#00f0ff] text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add EV</span>
                  </button>
                </div>

                {/* Add Vehicle Form Drawer */}
                {isAddingVehicle && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 rounded-2xl bg-[#141820] border border-[#00f0ff]/30 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#00f0ff]">Add New Electric Vehicle</span>
                      <button
                        type="button"
                        onClick={() => setIsAddingVehicle(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Make</label>
                        <input
                          type="text"
                          value={newMake}
                          onChange={(e) => setNewMake(e.target.value)}
                          placeholder="e.g. Tesla"
                          className="w-full bg-[#10141a] border border-white/10 rounded-lg p-2 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Model</label>
                        <input
                          type="text"
                          value={newModel}
                          onChange={(e) => setNewModel(e.target.value)}
                          placeholder="e.g. Model Y"
                          className="w-full bg-[#10141a] border border-white/10 rounded-lg p-2 text-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Year</label>
                        <input
                          type="text"
                          value={newYear}
                          onChange={(e) => setNewYear(e.target.value)}
                          placeholder="2024"
                          className="w-full bg-[#10141a] border border-white/10 rounded-lg p-2 text-white text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Battery (kWh)</label>
                        <input
                          type="text"
                          value={newKwh}
                          onChange={(e) => setNewKwh(e.target.value)}
                          placeholder="75"
                          className="w-full bg-[#10141a] border border-white/10 rounded-lg p-2 text-white text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Port</label>
                        <select
                          value={newConnector}
                          onChange={(e) => setNewConnector(e.target.value)}
                          className="w-full bg-[#10141a] border border-white/10 rounded-lg p-2 text-white text-xs"
                        >
                          <option value="CCS2">CCS2</option>
                          <option value="GB/T">GB/T</option>
                          <option value="Type2">Type 2</option>
                          <option value="CHAdeMO">CHAdeMO</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">License Plate</label>
                      <input
                        type="text"
                        value={newPlate}
                        onChange={(e) => setNewPlate(e.target.value)}
                        placeholder="GW 4821 - 24"
                        className="w-full bg-[#10141a] border border-white/10 rounded-lg p-2 text-white text-xs font-mono"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddVehicle}
                      className="w-full py-2 bg-[#00f0ff] hover:bg-[#33f3ff] text-[#0a0e14] font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Save to Garage
                    </button>
                  </motion.div>
                )}

                {/* List of Vehicles */}
                <div className="space-y-2">
                  {vehicles.map((veh) => {
                    const fullName = `${veh.make} ${veh.model}`;
                    const isSelected = activeVehicle.includes(veh.model) || activeVehicle.includes(veh.make);

                    return (
                      <div
                        key={veh.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#181c24] border-[#00f0ff] shadow-md shadow-black/40'
                            : 'bg-[#141820] border-white/[0.08] hover:border-white/20'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white font-mono">{fullName}</span>
                            {isSelected && (
                              <span className="px-2 py-0.5 rounded-full bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 text-[10px] font-mono font-bold">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-[#94a3b8] font-mono">
                            <span>{veh.batteryCapacityKwh} kWh</span>
                            <span>·</span>
                            <span>{veh.connectorType}</span>
                            <span>·</span>
                            <span>{veh.licensePlate}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {!isSelected && (
                            <button
                              type="button"
                              onClick={() => onSelectVehicle(fullName)}
                              className="px-2.5 py-1 rounded-xl bg-[#181c24] hover:bg-[#20252e] border border-white/10 text-slate-200 text-xs font-medium cursor-pointer"
                            >
                              Select
                            </button>
                          )}
                          {vehicles.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setVehicles(vehicles.filter((v) => v.id !== veh.id));
                              }}
                              title="Delete vehicle"
                              className="p-1.5 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: Preferences */}
            {activeTab === 'preferences' && (
              <div className="space-y-4 animate-in fade-in">
                {/* Target Battery SoC Limit */}
                <div className="p-4 rounded-2xl bg-[#141820] border border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">Target Charge Limit</h4>
                      <p className="text-[11px] text-[#94a3b8]">Automatic session cutoff threshold.</p>
                    </div>
                    <span className="text-sm font-bold text-[#00f0ff] font-mono">{targetChargeLimit}%</span>
                  </div>

                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="5"
                    value={targetChargeLimit}
                    onChange={(e) => setTargetChargeLimit(parseInt(e.target.value, 10))}
                    className="w-full accent-[#00f0ff] cursor-pointer"
                  />

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <button
                      type="button"
                      onClick={() => setTargetChargeLimit(80)}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        targetChargeLimit === 80
                          ? 'bg-[#181c24] border-[#00f0ff] text-white'
                          : 'bg-[#10141a] border-white/5 text-slate-400'
                      }`}
                    >
                      <span className="font-bold block text-[#00f0ff]">80% Daily Commute</span>
                      <span className="text-[10px] text-slate-400">Protects cell health</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetChargeLimit(100)}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        targetChargeLimit === 100
                          ? 'bg-[#181c24] border-[#00f0ff] text-white'
                          : 'bg-[#10141a] border-white/5 text-slate-400'
                      }`}
                    >
                      <span className="font-bold block text-[#00f0ff]">100% Road Trip</span>
                      <span className="text-[10px] text-slate-400">Accra - Kumasi Corridor</span>
                    </button>
                  </div>
                </div>

                {/* Default Payment Network */}
                <div className="p-4 rounded-2xl bg-[#141820] border border-white/[0.08] space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-white">Default Payment Gateway</h4>
                    <p className="text-[11px] text-[#94a3b8]">Ghana Mobile Money or card auto-debit preference.</p>
                  </div>

                  <div className="space-y-2">
                    {[
                      { key: 'MTN_MOMO', label: 'MTN Mobile Money (*170#)', logo: MtnMomoLogo },
                      { key: 'TELECEL_CASH', label: 'Telecel Cash (*110#)', logo: TelecelLogo },
                      { key: 'MASTERCARD', label: 'Mastercard 3D Secure', logo: MastercardLogo },
                    ].map((m) => {
                      const isSelected = paymentMethod === m.key;
                      const LogoComponent = m.logo;

                      return (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() => setPaymentMethod(m.key as any)}
                          className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#181c24] border-[#00f0ff] text-white'
                              : 'bg-[#10141a] border-white/5 text-slate-400 hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <LogoComponent size="icon" />
                            <span className="text-xs font-semibold">{m.label}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#00f0ff]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SMS Receipts Toggle */}
                <div className="p-4 rounded-2xl bg-[#141820] border border-white/[0.08] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-white">SMS Charging Receipts</h4>
                    <p className="text-[11px] text-[#94a3b8]">
                      Receive Moolre SMS receipts when charging session completes.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSmsReceipts(!smsReceipts)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      smsReceipts ? 'bg-[#00f0ff]' : 'bg-[#181c24] border border-white/10'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-black transition-transform ${
                        smsReceipts ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. Bottom Action Footer */}
          <div className="p-4 bg-[#141820] border-t border-white/[0.08] space-y-2 shrink-0">
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="w-full py-2.5 rounded-xl bg-[#00f0ff] hover:bg-[#33f3ff] text-[#0a0e14] font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 shadow-md shadow-black/40"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>SAVE PROFILE CHANGES</span>
                </>
              )}
            </button>

            {/* Quick Actions Row */}
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              {onOpenAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdmin();
                  }}
                  className="py-2 px-2.5 rounded-xl bg-[#181c24] hover:bg-[#20252e] border border-white/10 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5 text-[#00e699]" />
                  <span>Station Admin</span>
                </button>
              )}

              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="py-2 px-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.99]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
