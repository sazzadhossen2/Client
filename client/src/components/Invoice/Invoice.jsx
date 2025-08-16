import React from "react";
import InvoiceStore from "../../store/InvoiceStore";

function Invoice() {
  const { CreateInvoice } = InvoiceStore();

  if (!CreateInvoice) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-success" role="status" />
        <p className="mt-3">Loading Invoice...</p>
      </div>
    );
  }

  const ssl = CreateInvoice.sslResponse;
  const tranId = CreateInvoice.tran_id;

  return (
    <div className="container py-4">
      {/* Store Info */}
      <div className="card shadow-sm mb-4">
        <div className="card-body d-flex align-items-center">
          <img
            src={ssl.storeLogo}
            alt={ssl.store_name}
            style={{ width: 60, height: 60, objectFit: "contain" }}
            className="me-3"
          />
          <div>
            <h5 className="mb-0">{ssl.store_name}</h5>
            <small className="text-muted">Transaction ID: {tranId}</small>
          </div>
          <div className="ms-auto">
            <a
              href={ssl.GatewayPageURL}
              target="_blank"
              rel="noreferrer"
              className="btn btn-success"
            >
              Checkout
            </a>
          </div>
        </div>
      </div>

      {/* Transaction Details */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h6 className="mb-3">Transaction Details</h6>
          <ul className="list-group list-group-flush">
            <li className="list-group-item d-flex justify-content-between">
              <span>Status:</span> <strong>{ssl.status}</strong>
            </li>
            <li className="list-group-item d-flex justify-content-between">
              <span>Session Key:</span> {ssl.sessionkey}
            </li>
            <li className="list-group-item d-flex justify-content-between">
              <span>Store Banner:</span>
              {ssl.storeBanner ? (
                <img
                  src={ssl.storeBanner}
                  alt="Store Banner"
                  style={{ height: 30 }}
                />
              ) : (
                "N/A"
              )}
            </li>
          </ul>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="card shadow-sm">
        <div className="card-body">
          <h6 className="mb-3">Available Payment Methods</h6>
          <div className="row">
            {ssl.desc.map((method, idx) => (
              <div className="col-md-4 mb-3" key={idx}>
                <div className="border rounded p-3 h-100 d-flex flex-column align-items-center">
                  <img
                    src={method.logo}
                    alt={method.name}
                    style={{ height: 40, marginBottom: 10 }}
                  />
                  <strong className="text-center">{method.name}</strong>
                  <small className="text-muted">{method.type}</small>
                  <a
                    href={method.redirectGatewayURL || ssl.GatewayPageURL}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline-success btn-sm mt-auto"
                  >
                    Pay Now
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Invoice;
