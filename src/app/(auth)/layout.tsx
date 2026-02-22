import { Fuel } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 p-12 flex-col justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Fuel className="h-8 w-8 text-fuel-orange" />
          <span className="text-xl font-bold text-white">FuelOrder</span>
        </Link>
        <div>
          <h2 className="text-3xl font-bold text-white">
            Powering Your Business with <span className="text-fuel-orange">Reliable Fuel Delivery</span>
          </h2>
          <p className="mt-4 text-white/60">
            Transparent pricing, GST-compliant invoicing, and doorstep fuel delivery
            for businesses across India.
          </p>
        </div>
        <p className="text-white/40 text-sm">&copy; {new Date().getFullYear()} Fuel Order Platform</p>
      </div>

      {/* Right - form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-gray-50">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
