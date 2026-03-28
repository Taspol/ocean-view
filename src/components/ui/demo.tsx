import * as React from 'react';
import TravelConnectSignIn1 from '@/components/ui/travel-connect-signin-1';
import ScrollPhoneLanding from '@/components/ui/scroll-phone-landing';

function DemoAiAssistatBasic() {
  const [mode, setMode] = React.useState<'login' | 'signup'>('login');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [birthdate, setBirthdate] = React.useState('');

  return (
    <TravelConnectSignIn1
      mode={mode}
      setMode={setMode}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      birthdate={birthdate}
      setBirthdate={setBirthdate}
      loading={false}
      lineConnected={false}
      lineConnecting={false}
      onConnectLine={() => undefined}
      onSubmit={(event) => event.preventDefault()}
      error=""
      successMessage=""
    />
  );
}

export { DemoAiAssistatBasic };

export default function DemoOne() {
  return <ScrollPhoneLanding />;
}
