import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import api, { apiErrorMessage } from '../../lib/api';
import Button from '../../components/ui/Button';
import { pageEnter } from '../../lib/motion';

const RESEND_COOLDOWN = 30;

export default function VerifyCode() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [maskedEmail, setMaskedEmail] = useState('');
  const [digits, setDigits] = useState(Array(6).fill(''));
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputsRef = useRef([]);

  const sendCode = async () => {
    try {
      const res = await api.post(`/api/exam/invite/${token}/request-code`);
      setMaskedEmail(res.data.maskedEmail);
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  useEffect(() => { sendCode(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < 5) inputsRef.current[index + 1]?.focus();
    if (next.every((d) => d) && next.join('').length === 6) submit(next.join(''));
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const submit = async (code) => {
    setVerifying(true);
    try {
      await api.post(`/api/exam/invite/${token}/verify-code`, { code });
      navigate(`/exam/${token}/instructions`);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'That code is incorrect or has expired'));
      setDigits(Array(6).fill(''));
      inputsRef.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  return (
    <motion.div {...pageEnter} className="text-center py-8">
      <h1 className="font-display text-page-title text-ink mb-2">Enter your code</h1>
      <p className="text-body text-graphite mb-8">
        {maskedEmail ? `We sent a 6-digit code to ${maskedEmail}` : 'Sending your code...'}
      </p>

      <div className="flex justify-center gap-2 mb-8">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputsRef.current[i] = el; }}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            inputMode="numeric"
            maxLength={1}
            disabled={verifying}
            aria-label={`Digit ${i + 1}`}
            className="w-12 h-14 text-center font-mono text-[22px] rounded-card border border-rule bg-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-marker focus-visible:ring-offset-2"
          />
        ))}
      </div>

      <Button variant="ghost" onClick={sendCode} disabled={cooldown > 0}>
        {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
      </Button>
    </motion.div>
  );
}
