// @ts-nocheck
const EnrichButton = ({ product, isEnriching, onEnrich }: { product: any; isEnriching: boolean; onEnrich: () => void }) => {
  // Button style classes based on state
  const getButtonClasses = () => {
    if (isEnriching) {
      return "btn btn-sm btn-primary w-full";
    }
    
    return product.ai_enriched 
      ? "btn btn-sm btn-success w-full" 
      : "btn btn-sm btn-primary w-full";
  };

  // Button content based on state
  const getButtonContent = () => {
    if (isEnriching) {
      return (
        <>
          <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
          <span>Processing...</span>
        </>
      );
    }
    
    return product.ai_enriched ? "Enrich again?" : "Enrich";
  };

  return (
    <button
      onClick={() => onEnrich(product.id)}
      disabled={isEnriching}
      className={getButtonClasses()}
      style={{ minWidth: '120px', height: '32px' }}
    >
      {getButtonContent()}
    </button>
  );
};

export default EnrichButton;