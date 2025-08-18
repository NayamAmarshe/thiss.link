"use client";

import Turnstile from "react-turnstile";

const TurnstileWidget = ({
  onVerify,
  onError,
  onExpire,
  theme = "auto",
  siteKey,
}) => {
  return (
    <Turnstile
      sitekey={siteKey}
      onVerify={onVerify}
      onError={onError}
      onExpire={onExpire}
      theme={theme}
    />
  );
};

export default TurnstileWidget;
