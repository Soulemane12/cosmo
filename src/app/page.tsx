"use client";

import { useAuth } from "@/data/AuthContext";
import Link from "next/link";
import AppHeader from "./components/AppHeader";

export default function Home() {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-gray-900">
      <AppHeader currentPath="/" />
      
      <main>
        <div className="relative px-6 lg:px-8">
          <div className="mx-auto max-w-3xl pt-20 pb-32">
            <div>
              <div className="text-center">
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl logo-text">
                  cosmologo
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  The premier marketplace for cosmetic services. Connect with top providers or find new clients.
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                  {currentUser ? (
                    currentUser.type === 'user' ? (
                      <Link
                        href="/user"
                        className="rounded-md bg-green-600 px-5 py-3 text-base font-medium text-white shadow-sm hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                      >
                        My Dashboard
                      </Link>
                    ) : (
                      <Link
                        href="/service_provider"
                        className="rounded-md bg-blue-600 px-5 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                      >
                        Provider Dashboard
                      </Link>
                    )
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="rounded-md bg-green-600 px-5 py-3 text-base font-medium text-white shadow-sm hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                      >
                        Log In
                      </Link>
                      <Link
                        href="/signup"
                        className="rounded-md bg-blue-600 px-5 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature section */}
        <div className="bg-gray-800 py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">How It Works</h2>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                A simple, efficient platform for connecting clients with cosmetic service providers.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                <div className="flex flex-col">
                  <dt className="text-xl font-semibold leading-7 text-white">
                    <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-green-600">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                    For Clients
                  </dt>
                  <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-400">
                    <p className="flex-auto">
                      Browse providers, compare services, and request appointments all in one place.
                    </p>
                    <p className="mt-6">
                      <Link
                        href={currentUser?.type === 'user' ? "/user" : "/signup"}
                        className="text-sm font-semibold leading-6 text-green-400"
                      >
                        {currentUser?.type === 'user' ? "Go to dashboard" : "Create client account"} <span aria-hidden="true">→</span>
                      </Link>
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-xl font-semibold leading-7 text-white">
                    <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                      </svg>
                    </div>
                    For Providers
                  </dt>
                  <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-400">
                    <p className="flex-auto">
                      Manage incoming requests, showcase your services, and grow your client base.
                    </p>
                    <p className="mt-6">
                      <Link
                        href={currentUser?.type === 'provider' ? "/service_provider" : "/signup"}
                        className="text-sm font-semibold leading-6 text-blue-400"
                      >
                        {currentUser?.type === 'provider' ? "Go to dashboard" : "Create provider account"} <span aria-hidden="true">→</span>
                      </Link>
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-xl font-semibold leading-7 text-white">
                    <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                    </div>
                    Secure & Private
                  </dt>
                  <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-400">
                    <p className="flex-auto">
                      Your data is protected. All interactions and medical information remain confidential.
                    </p>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}