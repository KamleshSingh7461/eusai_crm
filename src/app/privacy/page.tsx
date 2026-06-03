import React from 'react';

export default function PrivacyPolicyPage() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-6 lg:px-8 text-gray-800 dark:text-gray-200">
            <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Privacy Policy</h1>
            <p className="mb-4 text-sm text-gray-500">Last Updated: {new Date().toLocaleDateString()}</p>
            
            <div className="space-y-6 text-base leading-relaxed">
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">1. Introduction</h2>
                    <p>
                        Welcome to EUSAI CRM ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. 
                        This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our application (crm.eusaiteam.com) 
                        and use our services.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">2. Information We Collect</h2>
                    <p className="mb-2">We collect personal information that you voluntarily provide to us when you register on the application, including:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Personal Data:</strong> Name, email address, and profile picture obtained via Google OAuth.</li>
                        <li><strong>Google Calendar Data (Restricted Scope):</strong> We request read-only access to your Google Calendar (`https://www.googleapis.com/auth/calendar.readonly`).</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">3. How We Use Your Information (Including Google Data)</h2>
                    <p className="mb-2">We use the information we collect or receive for the following purposes:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Account Creation and Login:</strong> We use your Google profile information (email, name, picture) to create your CRM account and log you in securely.</li>
                        <li><strong>Calendar Integration:</strong> Our CRM uses your Google Calendar data (read-only) strictly to display your upcoming meetings, events, and tasks directly within the CRM dashboard. This helps you manage your schedule without leaving the application.</li>
                        <li><strong>Strict Data Usage Policy:</strong> We do <strong>not</strong> share, sell, or transfer your Google Calendar data to any third parties, advertising platforms, or data brokers. The data is only used to provide the calendar visualization features within your CRM account.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">4. Data Storage and Security</h2>
                    <p>
                        We use administrative, technical, and physical security measures to help protect your personal information. 
                        While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, 
                        no security measures are perfect or impenetrable. Your Google OAuth tokens are stored securely in our database and are used solely to fetch your data on your behalf.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">5. Your Rights</h2>
                    <p>
                        You have the right to revoke our access to your Google account at any time. You can do this by visiting your Google Account settings 
                        (myaccount.google.com/permissions) and removing the access granted to EUSAI CRM. Upon revocation, we will immediately lose access to your calendar and profile data, and we will delete any stored tokens associated with your account.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">6. Contact Us</h2>
                    <p>
                        If you have questions or comments about this Privacy Policy, please contact us at: <br/>
                        <strong>Email:</strong> admin@eusaiteam.com
                    </p>
                </section>
            </div>
        </div>
    );
}
