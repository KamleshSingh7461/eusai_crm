import React from 'react';

export default function TermsOfServicePage() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-6 lg:px-8 text-gray-800 dark:text-gray-200">
            <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Terms of Service</h1>
            <p className="mb-4 text-sm text-gray-500">Last Updated: {new Date().toLocaleDateString()}</p>
            
            <div className="space-y-6 text-base leading-relaxed">
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">1. Agreement to Terms</h2>
                    <p>
                        By accessing or using EUSAI CRM ("the Service"), you agree to be bound by these Terms of Service. 
                        If you disagree with any part of the terms, you may not access the Service.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">2. Description of Service</h2>
                    <p>
                        EUSAI CRM is an internal business process management tool designed for authorized team members. 
                        It provides features for task management, project tracking, and integrates with third-party services like Google Workspace.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">3. User Accounts & Google OAuth</h2>
                    <p className="mb-2">
                        To use the Service, you must log in using your Google account. By doing so, you agree that:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>You are authorized to use the Google account provided.</li>
                        <li>You grant us permission to access the data scopes requested during the OAuth login process (e.g., profile information and calendar data).</li>
                        <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">4. Acceptable Use</h2>
                    <p>
                        You agree to use the Service only for lawful internal business purposes. You must not:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mt-2">
                        <li>Use the Service in any way that causes, or may cause, damage to the Service or impairment of the availability or accessibility of the Service.</li>
                        <li>Use the Service to copy, store, host, transmit, send, use, publish, or distribute any material which consists of (or is linked to) any spyware, computer virus, Trojan horse, or other malicious computer software.</li>
                        <li>Attempt to gain unauthorized access to any portion of the Service or any systems or networks connected to the Service.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">5. Termination</h2>
                    <p>
                        We may terminate or suspend your access to the Service immediately, without prior notice or liability, 
                        for any reason whatsoever, including without limitation if you breach the Terms.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">6. Contact Information</h2>
                    <p>
                        If you have any questions about these Terms, please contact us at: <br/>
                        <strong>Email:</strong> admin@eusaiteam.com
                    </p>
                </section>
            </div>
        </div>
    );
}
