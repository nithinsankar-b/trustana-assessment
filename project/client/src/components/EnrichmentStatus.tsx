import React from 'react';
import type { EnrichmentJob } from '../types/enrichment';
import { getEnrichmentJobStatus } from '../services/api';

interface EnrichmentStatusProps {
  jobId: number | null;
  onCompleted?: () => void; // New callback for when job completes
}

const EnrichmentStatus: React.FC<EnrichmentStatusProps> = ({ jobId, onCompleted }) => {
  const [job, setJob] = React.useState<EnrichmentJob | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');
  const [wasCompletedCalled, setWasCompletedCalled] = React.useState<boolean>(false);

  React.useEffect(() => {
    let timerId: NodeJS.Timeout;

    const checkStatus = async () => {
      if (!jobId) return;

      try {
        setLoading(true);
        const jobStatus = await getEnrichmentJobStatus(jobId);
        setJob(jobStatus);
        setError('');

        // Continue polling if job is still in progress
        if (jobStatus.status === 'PENDING' || jobStatus.status === 'PROCESSING') {
          timerId = setTimeout(checkStatus, 3000); // Poll every 3 seconds
        } else if (jobStatus.status === 'COMPLETED' && onCompleted && !wasCompletedCalled) {
          // Call the completion callback when job is done - only once
          setWasCompletedCalled(true);
          onCompleted();
        }
      } catch (err) {
        setError('Failed to fetch enrichment status');
        console.error('Error fetching job status:', err);
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      checkStatus();
    }

    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [jobId, onCompleted, wasCompletedCalled]);

  // Reset the wasCompletedCalled state when jobId changes
  React.useEffect(() => {
    setWasCompletedCalled(false);
  }, [jobId]);

  if (!jobId) {
    return null;
  }

  const getStatusClass = () => {
    switch (job?.status) {
      case 'COMPLETED': return 'status-completed';
      case 'FAILED': return 'status-failed';
      case 'PROCESSING': return 'status-processing';
      default: return 'status-pending';
    }
  };

  const getProgressBarColor = () => {
    if (job?.status === 'COMPLETED') return 'progress-bar-success';
    return 'progress-bar-primary';
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Enrichment Status</h3>
        {job && (
          <span className={`status ${getStatusClass()}`}>
            {formatStatus(job.status)}
          </span>
        )}
      </div>
      
      {loading && !job && (
        <div className="loader-container">
          <div className="loader"></div>
          <p>Loading job status...</p>
        </div>
      )}
      
      {error && (
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {job && (
        <div>
          <div className="mt-4 mb-2 d-flex justify-between align-center">
            <span className="form-label mb-0">Progress:</span>
            <span className="text-primary font-weight-500">{Math.round(job.progress)}%</span>
          </div>
          
          <div className="progress">
            <div 
              className={`progress-bar ${getProgressBarColor()}`}
              style={{ width: `${job.progress}%` }}
            ></div>
          </div>
          
          {job.status === 'COMPLETED' && job.result && (
            <div className="mt-4 d-flex gap-3">
              <div className="badge badge-success">
                Enriched: {(job.result as any).enrichedCount} products
              </div>
              <div className="badge badge-danger">
                Failed: {(job.result as any).failedCount} products
              </div>
            </div>
          )}
          
          {job.status === 'FAILED' && job.result && (
            <div className="alert alert-danger mt-3">
              {(job.result as any).error || 'Unknown error occurred during enrichment'}
            </div>
          )}
        </div>
      )}
      
      {/* @ts-ignore */}
      <style jsx>{`
        .status {
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .status-completed {
          background-color: #d1e7dd;
          color: #0f5132;
        }
        
        .status-failed {
          background-color: #f8d7da;
          color: #842029;
        }
        
        .status-processing {
          background-color: #cfe2ff;
          color: #084298;
        }
        
        .status-pending {
          background-color: #fff3cd;
          color: #664d03;
        }
        
        .progress {
          height: 0.5rem;
          background-color: #e9ecef;
          border-radius: 0.25rem;
          overflow: hidden;
        }
        
        .progress-bar {
          height: 100%;
          transition: width 0.3s ease;
        }
        
        .progress-bar-primary {
          background-color: #0d6efd;
        }
        
        .progress-bar-success {
          background-color: #198754;
        }
      `}</style>
    </div>
  );
};

// Helper function
function formatStatus(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default EnrichmentStatus;