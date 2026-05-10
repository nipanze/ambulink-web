'use client'
import Link from 'next/link'
import Image from 'next/image'
import { AlertCircle, MapPin, Clock, Shield, Phone, Activity, Building2, Navigation, Hospital, Calendar } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Image src="/images/icon.png" alt="AmbuLink Logo" width={32} height={32} />
          <span className="text-xl font-black text-red-600 tracking-tight">AmbuLink</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="btn-secondary text-sm py-1.5">Login</Link>
          <Link href="/auth/register" className="btn-primary text-sm py-1.5">Register</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-20 pb-16">
        <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <Activity size={14} /> Uganda's First Smart Ambulance Platform
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-4 leading-tight">
          Emergency Help,<br/>
          <span className="text-red-600">One Tap Away</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-xl mb-10">
          Connecting patients with the nearest registered ambulance in real-time.
          Every second counts — AmbuLink is ready 24/7.
        </p>

        {/* SOS Button */}
        <Link href="/auth/login?redirect=/dashboard">
          <button className="sos-btn mb-4">
            <AlertCircle size={40} />
            <span className="text-base font-black tracking-widest">SOS</span>
          </button>
        </Link>
        <p className="text-sm text-gray-500">Tap to request an ambulance now</p>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: MapPin,   color: 'text-red-600',  bg: 'bg-red-50',   title: 'Real-Time Tracking', desc: 'Watch your ambulance approach live on the map — from dispatch to arrival.' },
          { icon: Clock,    color: 'text-blue-600', bg: 'bg-blue-50',  title: 'Avg. < 10 Min',      desc: 'Automated Haversine matching connects you to the nearest available driver instantly.' },
          { icon: Shield,   color: 'text-green-600',bg: 'bg-green-50', title: 'Verified Drivers',   desc: 'All drivers are licensed, background-checked, and vehicle-inspected before activation.' },
        ].map(({ icon: Icon, color, bg, title, desc }) => (
          <div key={title} className="card flex flex-col items-start gap-3">
            <div className={`${bg} p-3 rounded-lg`}>
              <Icon className={color} size={22} />
            </div>
            <h3 className="font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{desc}</p>
          </div>
        ))}
      </section>

      {/* Service types */}
      <section className="bg-gray-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <h2 className="text-3xl font-black mb-2">We Cover Every Emergency</h2>
          <p className="text-gray-400">Urban, highway, institutional, or scheduled transport.</p>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Building2, label: 'Urban', sub: 'Kampala & major cities' },
            { icon: Navigation, label: 'Highway', sub: 'Road corridor incidents' },
            { icon: Hospital, label: 'Institutional', sub: 'Hospitals & organisations' },
            { icon: Calendar, label: 'Scheduled', sub: 'Planned patient transport' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="bg-gray-800 rounded-xl p-4 text-center">
              <div className="flex justify-center text-red-500 mb-2">
                <Icon size={32} />
              </div>
              <div className="font-bold">{label}</div>
              <div className="text-xs text-gray-400 mt-1">{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-16 px-6">
        <h2 className="text-2xl font-black mb-3">Are you a driver or institution?</h2>
        <p className="text-gray-500 mb-6">Join the AmbuLink network and help save lives.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/auth/register?role=driver" className="btn-primary">Register as Driver</Link>
          <Link href="/auth/register?role=institution_rep" className="btn-secondary">Register Institution</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-gray-400 px-6">
        <p>© 2026 AmbuLink — Kampala International University</p>
        <p className="mt-1">Tumusiime Mahad · Mugisha Abdul · Kato Ashraf</p>
        <div className="flex items-center justify-center gap-1 mt-2 text-red-500 text-xs">
          <Phone size={12} /> Emergency: <strong>+256 800 AMBULINK</strong>
        </div>
      </footer>
    </main>
  )
}
