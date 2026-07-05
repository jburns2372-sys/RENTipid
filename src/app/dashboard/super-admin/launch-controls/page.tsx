import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Sliders, ShieldAlert, ToggleLeft, ToggleRight } from 'lucide-react';

export default async function LaunchControlsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const controls = [
    { group: "Access Controls", items: [
      { name: "Public Registration", active: false, desc: "Allow guests to sign up freely.", danger: true },
      { name: "Invite-Only Mode", active: true, desc: "Registration requires a beta code." },
      { name: "Renter Registration", active: true, desc: "Allow standard renter accounts." },
      { name: "Provider Registration", active: true, desc: "Allow individual provider accounts." },
    ]},
    { group: "Platform Features", items: [
      { name: "Require KYC for Booking", active: true, desc: "Renters must upload IDs." },
      { name: "Require Admin Listing Approval", active: true, desc: "Listings must be manually verified." },
      { name: "Enable Bookings", active: true, desc: "Allow booking requests to be submitted." },
      { name: "Enable Inspections & Disputes", active: true, desc: "Allow pre-rental inspections and claims." },
    ]},
    { group: "Emergency Overrides", items: [
      { name: "Maintenance Mode", active: false, desc: "Redirect all non-admins to a downtime page.", danger: true },
      { name: "Global Booking Freeze", active: false, desc: "Immediately halt all new bookings.", danger: true },
    ]}
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sliders size={24} className="text-blue-600" /> Master Launch Controls
        </h1>
        <p className="text-gray-500 mt-1">Super Admin dashboard to dynamically enable or kill platform modules.</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-8 flex items-start gap-3">
        <ShieldAlert size={20} className="shrink-0 mt-0.5 text-blue-600" />
        <div>
          <p className="font-semibold text-blue-900">Audit Logging Enabled</p>
          <p className="text-sm mt-1 text-blue-800">
            All toggle changes on this page are permanently written to the system Audit Log, recording the executing Super Admin and the exact timestamp.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {controls.map((group, idx) => (
          <div key={idx}>
            <h2 className="text-lg font-bold text-gray-800 mb-4">{group.group}</h2>
            <div className="bg-white rounded-xl shadow-sm border divide-y">
              {group.items.map((item, i) => (
                <div key={i} className="p-5 flex items-center justify-between hover:bg-gray-50 transition">
                  <div className="pr-4">
                    <h3 className={`font-semibold ${item.danger ? 'text-red-700' : 'text-gray-900'}`}>{item.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                  </div>
                  <button className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full font-medium transition ${item.active ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {item.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
