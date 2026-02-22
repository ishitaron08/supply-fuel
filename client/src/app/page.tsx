import Link from 'next/link';
import { Fuel, ArrowRight, ShieldCheck, Truck, FileText, Clock3 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <nav className="flex items-center justify-between max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Fuel className="h-7 w-7 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">FuelOrder</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
              Login
            </Link>
            <Link href="/register" className="btn-primary text-sm">
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2 card p-8 md:p-10">
            <p className="text-sm font-semibold text-primary-700 uppercase tracking-wide">B2B Fuel Operations</p>
            <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
              Reliable diesel delivery for active project sites
            </h1>
            <p className="mt-4 text-gray-600 max-w-2xl">
              Manage orders, delivery schedules, and invoicing from one dashboard built for procurement teams and site managers.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/register" className="btn-primary inline-flex items-center justify-center gap-2">
                Create Account <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="btn-secondary inline-flex items-center justify-center">
                Go to Dashboard
              </Link>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-base font-semibold text-gray-900">Today at a glance</h2>
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Active Cities</span>
                <span className="text-sm font-semibold text-gray-900">20+</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Average Dispatch Time</span>
                <span className="text-sm font-semibold text-gray-900">&lt; 2 hrs</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Invoice Turnaround</span>
                <span className="text-sm font-semibold text-gray-900">Same day</span>
              </div>
              <div className="pt-3 border-t border-gray-200 text-sm text-gray-600">
                COD workflow enabled for field operations and delivery handover.
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Truck className="h-5 w-5 text-primary-700" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Scheduled Dispatch</h3>
            <p className="mt-2 text-sm text-gray-600">
              Assign site deliveries with quantity, date, and route-specific notes for accurate fulfillment.
            </p>
          </div>

          <div className="card p-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-green-700" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Compliance Ready</h3>
            <p className="mt-2 text-sm text-gray-600">
              Built-in GST calculations and verifiable records from order approval to delivery confirmation.
            </p>
          </div>

          <div className="card p-6">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-orange-700" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Invoice Tracking</h3>
            <p className="mt-2 text-sm text-gray-600">
              Keep billing clean with generated invoices, order linkage, and historical visibility for audits.
            </p>
          </div>
        </section>

        <section className="card p-6 md:p-8">
          <h2 className="text-xl font-semibold text-gray-900">How ordering works</h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Step 1</p>
              <p className="mt-1 font-medium text-gray-900">Select site</p>
              <p className="mt-2 text-sm text-gray-600">Choose delivery location and site contact details.</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Step 2</p>
              <p className="mt-1 font-medium text-gray-900">Confirm quantity</p>
              <p className="mt-2 text-sm text-gray-600">Enter liters required and requested delivery date.</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Step 3</p>
              <p className="mt-1 font-medium text-gray-900">Track delivery</p>
              <p className="mt-2 text-sm text-gray-600">Order is approved, assigned, and moved to dispatch.</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-primary-700" />
                <p className="font-medium text-gray-900">COD settlement</p>
              </div>
              <p className="mt-2 text-sm text-gray-600">Payment is completed at delivery confirmation.</p>
            </div>
          </div>
        </section>

        <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 card p-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Ready to place your next fuel order?</h2>
            <p className="text-sm text-gray-600 mt-1">Create an account and start managing deliveries with COD workflow.</p>
          </div>
          <Link href="/register" className="btn-primary inline-flex items-center gap-2">
            Get Started <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
    </div>
  );
}
