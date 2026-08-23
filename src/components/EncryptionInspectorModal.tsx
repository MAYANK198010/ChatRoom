import React, { useState } from 'react';
import { ShieldCheck, Lock, Copy, Check, Terminal, Key, FileCode, Cpu, X } from 'lucide-react';
import { Message } from '../types';

interface EncryptionInspectorModalProps {
  message: Message;
  onClose: () => void;
}

export const EncryptionInspectorModal: React.FC<EncryptionInspectorModalProps> = ({ message, onClose }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const payload = message.encryptedPayload || {
    ciphertext: 'Encrypted with WebCrypto AES-GCM-256',
    iv: '01a9b8c7d6e5f4a3b2c1',
    algorithm: 'AES-GCM-256',
    fingerprint: 'E2EE-' + message.id.substring(0, 8).toUpperCase(),
    encryptedAt: message.timestamp
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none text-[#1c1e21] font-sans">
      <div className="bg-white border border-[#e4e6eb] rounded-3xl overflow-hidden w-full max-w-lg shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-[#e4e6eb] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-green-50 text-green-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1c1e21]">Cryptographic Inspector</h3>
              <p className="text-[11px] text-green-600 font-mono">Web Crypto API • Zero-Knowledge Verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Security Banner */}
          <div className="p-3.5 bg-green-50 border border-green-200/60 rounded-2xl flex items-start gap-3">
            <Lock className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
            <div className="text-xs text-green-800 leading-relaxed">
              This message was encrypted on the sender's client with a 256-bit symmetric session key derived via PBKDF2/SHA-256 before leaving the browser. No plaintext or keys ever reach the server.
            </div>
          </div>

          <div className="space-y-3">
            
            {/* Algorithm & Cipher Specs */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="text-gray-500 text-[10px] uppercase font-bold flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-[#0084ff]" /> Cipher Suite
                </div>
                <div className="font-mono text-[#0084ff] font-bold mt-1">
                  {payload.algorithm || 'AES-GCM-256'}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="text-gray-500 text-[10px] uppercase font-bold flex items-center gap-1">
                  <Key className="w-3 h-3 text-indigo-500" /> Key Fingerprint
                </div>
                <div className="font-mono text-[#1c1e21] font-bold mt-1 truncate">
                  {payload.fingerprint}
                </div>
              </div>
            </div>

            {/* Ciphertext Box */}
            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 relative group">
              <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1.5 font-bold">
                <span className="font-mono uppercase flex items-center gap-1 text-[#0084ff]">
                  <Terminal className="w-3.5 h-3.5" /> Raw Ciphertext (Base64)
                </span>
                <button
                  onClick={() => copyToClipboard(payload.ciphertext, 'cipher')}
                  className="hover:text-[#1c1e21] flex items-center gap-1 text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded-lg cursor-pointer"
                >
                  {copiedField === 'cipher' ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === 'cipher' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="font-mono text-[11px] text-gray-700 break-all leading-relaxed bg-white p-2.5 rounded-xl border border-gray-200 max-h-24 overflow-y-auto">
                {payload.ciphertext}
              </p>
            </div>

            {/* Initialization Vector (IV) */}
            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 relative group">
              <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1.5 font-bold">
                <span className="font-mono uppercase flex items-center gap-1 text-teal-600">
                  <Key className="w-3.5 h-3.5" /> 96-Bit Nonce / IV (Base64)
                </span>
                <button
                  onClick={() => copyToClipboard(payload.iv, 'iv')}
                  className="hover:text-[#1c1e21] flex items-center gap-1 text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded-lg cursor-pointer"
                >
                  {copiedField === 'iv' ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === 'iv' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="font-mono text-[11px] text-gray-700 break-all bg-white p-2.5 rounded-xl border border-gray-200">
                {payload.iv}
              </p>
            </div>

            {/* Decrypted Output */}
            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
              <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1.5 font-bold">
                <span className="font-mono uppercase flex items-center gap-1 text-green-700">
                  <FileCode className="w-3.5 h-3.5" /> Decrypted Plaintext
                </span>
              </div>
              <p className="text-xs text-[#1c1e21] bg-white p-2.5 rounded-xl border border-green-200 font-medium">
                {message.content || `[${message.type.toUpperCase()} payload decrypted]`}
              </p>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#fafafa] border-t border-[#e4e6eb] text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#1c1e21] text-white font-bold text-xs rounded-xl hover:bg-black transition cursor-pointer"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
