import { SignIn } from '@clerk/clerk-react';

const clerkAppearance = {
  variables: {
    colorPrimary: '#ce93d8',
    colorText: '#5e4b7a',
    colorTextSecondary: '#9b8bb4',
    colorBackground: '#faf6fc',
    colorInputBackground: '#ffffff',
    colorInputText: '#5e4b7a',
    borderRadius: '14px',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif'
  },
  elements: {
    card: {
      background: 'rgba(255, 255, 255, 0.92)',
      border: '1px solid rgba(225, 190, 231, 0.65)',
      boxShadow: '0 22px 70px rgba(94, 75, 122, 0.14)'
    },
    formButtonPrimary: {
      background: 'linear-gradient(135deg, #e1bee7, #f8bbd0)',
      color: '#5e4b7a',
      boxShadow: '0 10px 26px rgba(225, 190, 231, 0.45)'
    },
    footerActionLink: {
      color: '#7b1fa2'
    }
  }
};

export function AuthPage() {
  return (
    <main className="auth-shell">
      <div className="auth-aura auth-aura-one" />
      <div className="auth-aura auth-aura-two" />
      <section className="auth-panel auth-panel-clerk">
        <div className="brand-mark">S</div>
        <h1>SmartExpense AI</h1>
        <p>Sign in with Clerk to access your expense analytics.</p>
        <SignIn
          routing="hash"
          appearance={clerkAppearance}
          signUpUrl="#/sign-up"
        />
      </section>
      <section className="auth-preview" aria-label="Product preview">
        <div className="preview-toolbar"><span /><span /><span /></div>
        <div className="preview-row strong"><span>Today</span><b>Rs. 450</b></div>
        <div className="preview-chart"><i /><i /><i /><i /><i /></div>
        <div className="preview-row slide-up" style={{ animationDelay: '80ms' }}><span>SWIGGY</span><b>Food</b></div>
        <div className="preview-row slide-up" style={{ animationDelay: '160ms' }}><span>UPI import</span><b>92% confidence</b></div>
        <div className="preview-row slide-up" style={{ animationDelay: '240ms' }}><span>Forecast</span><b>Rs. 12,400</b></div>
      </section>
    </main>
  );
}
