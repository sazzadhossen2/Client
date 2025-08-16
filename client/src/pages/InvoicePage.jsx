
import InvoiceStore from '../store/InvoiceStore';
import Layout from '../components/layout/Layout';
import Invoice from '../components/Invoice/Invoice';
import { useEffect } from 'react';

function InvoicePage() {
  const {CreateInvoiceRequest} = InvoiceStore();
   useEffect(() => {
      (async () => { await CreateInvoiceRequest(); })();
    }, [CreateInvoiceRequest]);
   return (
    <Layout>
      <Invoice />
    </Layout>
  );
}

export default InvoicePage

