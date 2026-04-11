import React from 'react';
import { CompanyProfile } from '../../lib/company/identity';

interface Props {
  company: CompanyProfile;
  detectionCount: number;
}

export function CompanyCard({ company, detectionCount }: Props) {
  return (
    <div className="card">
      <div className="section-title">Company</div>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-pitch-text">{company.name}</h2>
          <p className="text-sm text-pitch-text-muted">{company.domain}</p>
        </div>
        <span className="badge bg-pitch-accent/20 text-pitch-accent border border-pitch-accent/30">
          {detectionCount} detected
        </span>
      </div>

      {company.tagline && (
        <p className="text-sm text-pitch-text-muted mt-2 italic">"{company.tagline}"</p>
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        {company.industry && company.industry !== 'Unknown' && (
          <span className="badge bg-pitch-border text-pitch-text-muted">{company.industry}</span>
        )}
        {company.type !== 'unknown' && (
          <span className="badge bg-pitch-border text-pitch-text-muted capitalize">{company.type}</span>
        )}
        {company.estimatedSize && (
          <span className="badge bg-pitch-border text-pitch-text-muted">{company.estimatedSize} employees</span>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-pitch-text-muted">
        {company.hasPricingPage && <span className="text-pitch-success">Pricing page</span>}
        {company.hasFreeTrial && <span className="text-pitch-success">Free trial</span>}
        {company.hasDemoPage && <span className="text-pitch-success">Demo booking</span>}
        {company.hasCareerPage && <span className="text-pitch-success">Careers page</span>}
        {company.hasBlog && <span className="text-pitch-success">Active blog</span>}
        {company.hasCaseStudies && <span className="text-pitch-success">Case studies</span>}
        {company.hasApiDocs && <span className="text-pitch-success">API docs</span>}
        {company.hasIntegrationsPage && <span className="text-pitch-success">Integrations</span>}
      </div>
    </div>
  );
}
