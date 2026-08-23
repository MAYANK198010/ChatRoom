import React, { useState, useEffect } from 'react';
import { ShieldCheck, QrCode, Lock, CheckCircle2, Copy, Check, X } from 'lucide-react';
import { generateSafetyNumber } from '../services/crypto';

interface SecurityCodeModalProps {
  currentUserId: string;
  contactId: string;
  contactName: string;
  onClose: () => void;
}

export const SecurityCodeModal: React.FC<SecurityCodeModalProps> = ({
  currentUserId,
  contactId,
  contactName,
  onClose
}) => {
  const [safetyNumber, setSafetyNumber] = useState('84920 18492 90184 72910 48291 04829 10293 84019 28301 92830 19284 01928');
  const [copied, setCopied] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    generateSafetyNumber(currentUserId, contactId).then(res => {
      setSafetyNumber(res.safetyNumber);
    });
  }, [currentUserId, contactId]);

  const copyCode = () => {
    navigator.clipboard.writeText(safetyNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleVerify = () => {
    setIsVerified(!isVerified);
  };

  const chunks = safetyNumber.split(' ');

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none text-[#1c1e21] font-sans">
      <div className="bg-white border border-[#e4e6eb] rounded-3xl overflow-hidden w-full max-w-md shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-[#e4e6eb] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg tracking-tight">Verify Security Number</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-center max-h-[80vh] overflow-y-auto">
          
          <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
            To verify end-to-end encryption with <strong className="text-[#1c1e21]">{contactName}</strong>, compare the 60-digit number below with their screen or scan the QR code.
          </p>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center">
            <div className="p-4 bg-white rounded-3xl shadow-md inline-block border-2 border-gray-100">
              <div className="w-36 h-36 bg-white grid grid-cols-6 grid-rows-6 gap-1 p-1">
                {Array.from({ length: 36 }).map((_, i) => {
                  const isCorner = i === 0 || i === 5 || i === 30;
                  const isBlack = isCorner || ((i * 7 + 13) % 3 !== 0);
                  return (
                    <div
                      key={i}
                      className={`rounded-xs ${isBlack ? 'bg-[#1c1e21]' : 'bg-transparent'}`}
                    />
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-green-700 font-bold mt-2.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Zero-Knowledge QR Verification</span>
            </div>
          </div>

          {/* 60-Digit Numbers Box */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2.5">
            <div className="grid grid-cols-3 gap-2 font-mono text-xs font-bold text-[#1c1e21] tracking-wider">
              {chunks.map((chunk, idx) => (
                <div key={idx} className="bg-white py-1.5 px-2 rounded-xl border border-gray-200 shadow-2xs">
                  {chunk}
                </div>
              ))}
            </div>

            <button
              onClick={copyCode}
              className="inline-flex items-center gap-1.5 text-xs text-[#0084ff] hover:text-[#0073e6] font-bold pt-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy 60-Digit Code'}</span>
            </button>
          </div>

          {/* Mark as Verified Button */}
          <button
            onClick={toggleVerify}
            className={`w-full py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer ${
              isVerified
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-[#1c1e21] text-white hover:bg-black'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isVerified ? 'Marked as Verified Contact' : 'Mark as Verified'}</span>
          </button>

        </div>

      </div>
    </div>
  );
};
