let _startMs = 0;

export function startOnboardingTimer(): void {
  _startMs = Date.now();
}

export function logOnboardingDuration(): void {
  if (!_startMs) return;
  const elapsed = ((Date.now() - _startMs) / 1000).toFixed(1);
  if (__DEV__) console.info(`[onboarding] completed in ${elapsed}s`);
  _startMs = 0;
}
