import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';
import api, { apiErrorMessage } from '../../lib/api';
import Card from '../../components/console/Card';
import Button from '../../components/console/Button';
import { pageEnter } from '../../lib/motion';

export default function BillingCallback() {
  const [params] = useSearchParams();
  const reference = params.get('reference') || params.get('trxref');
  const [state, setState] = useState('checking'); // checking | success | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!reference) {
      setState('error');
      setError('No payment reference was returned from Paystack.');
      return;
    }
    api.post('/api/billing/confirm', { reference })
      .then((res) => {
        setResult(res.data);
        setState(res.data.status === 'success' ? 'success' : 'error');
        if (res.data.status !== 'success') setError('This payment was not successful.');
      })
      .catch((err) => {
        setState('error');
        setError(apiErrorMessage(err, "We couldn't confirm this payment."));
      });
  }, [reference]);

  return (
    <motion.div {...pageEnter} className="max-w-md mx-auto py-16 text-center">
      <Card animate={false}>
        {state === 'checking' && (
          <>
            <p className="text-gray-400">Confirming your payment...</p>
          </>
        )}
        {state === 'success' && (
          <>
            <CheckCircle2 size={32} strokeWidth={1.75} className="text-green-400 mx-auto mb-4" />
            <p className="text-lg font-bold text-white mb-1">Payment confirmed</p>
            <p className="text-gray-400 mb-1">
              {result.creditsPurchased} credits added.
            </p>
            <p className="text-sm text-gray-500 font-mono mb-6">
              New balance: {result.creditBalance.toLocaleString()} credits
            </p>
            <Button to="/app/billing" variant="marker">Back to billing</Button>
          </>
        )}
        {state === 'error' && (
          <>
            <XCircle size={32} strokeWidth={1.75} className="text-red-400 mx-auto mb-4" />
            <p className="text-lg font-bold text-white mb-1">We couldn't confirm this payment</p>
            <p className="text-gray-400 mb-6">{error}</p>
            <Button to="/app/billing" variant="secondary">Back to billing</Button>
          </>
        )}
      </Card>
    </motion.div>
  );
}
