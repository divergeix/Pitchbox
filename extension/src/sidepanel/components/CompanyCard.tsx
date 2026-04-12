import React, { useState } from 'react';
import { CompanyProfile } from '../../lib/company/identity';

interface Props {
  company: any; // Using any since enriched profile has extra fields
  detectionCount: number;
}

export function CompanyCard({ company, detectionCount }: Props) {
  const [expanded, setExpanded] = useState(false);

  const socialLinks = company.socialLinks || {};
  const emails = company.emails || [];
  const phones = company.phones || [];
  const teamMembers = company.teamMembers || [];
  const customerLogos = company.customerLogos || [];
  const recentPosts = company.recentPosts || [];
  const testimonials = company.testimonials || [];
  const hasSocialLinks = Object.values(socialLinks).some(Boolean);
  const hasContactInfo = emails.length > 0 || phones.length > 0 || company.location;
  const hasEnrichment = hasSocialLinks || hasContactInfo || teamMembers.length > 0 || customerLogos.length > 0 || recentPosts.length > 0;

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

      {company.description && (
        <p className="text-xs text-pitch-text-muted mt-1 line-clamp-2">{company.description}</p>
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        {company.industry && company.industry !== 'Unknown' && (
          <span className={`badge ${company.aiClassified ? 'bg-purple-900/30 text-purple-400 border border-purple-800/40' : 'bg-pitch-border text-pitch-text-muted'}`}>
            {company.industry}{company.aiClassified ? ' (AI)' : ''}
          </span>
        )}
        {company.type !== 'unknown' && (
          <span className={`badge capitalize ${company.aiClassified ? 'bg-pitch-accent/20 text-pitch-accent border border-pitch-accent/30' : 'bg-pitch-border text-pitch-text-muted'}`}>
            {company.type}{company.aiClassified ? ' (AI)' : ''}
          </span>
        )}
        {/* Employee count removed - unreliable without external data */}
        {company.copyrightYear && (
          <span className="badge bg-pitch-border text-pitch-text-muted">Est. {company.copyrightYear}</span>
        )}
      </div>

      {/* Quick business signals */}
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

      {/* Social Links */}
      {hasSocialLinks && (
        <div className="flex flex-wrap gap-2 mt-3">
          {socialLinks.linkedin && (
            <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs bg-blue-900/30 text-blue-400 border border-blue-800/40 px-2 py-0.5 rounded-full hover:bg-blue-900/50">LinkedIn</a>
          )}
          {socialLinks.twitter && (
            <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-xs bg-sky-900/30 text-sky-400 border border-sky-800/40 px-2 py-0.5 rounded-full hover:bg-sky-900/50">Twitter/X</a>
          )}
          {socialLinks.facebook && (
            <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-xs bg-indigo-900/30 text-indigo-400 border border-indigo-800/40 px-2 py-0.5 rounded-full hover:bg-indigo-900/50">Facebook</a>
          )}
          {socialLinks.instagram && (
            <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-xs bg-pink-900/30 text-pink-400 border border-pink-800/40 px-2 py-0.5 rounded-full hover:bg-pink-900/50">Instagram</a>
          )}
          {socialLinks.youtube && (
            <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-xs bg-red-900/30 text-red-400 border border-red-800/40 px-2 py-0.5 rounded-full hover:bg-red-900/50">YouTube</a>
          )}
          {socialLinks.github && (
            <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-xs bg-gray-800/50 text-gray-300 border border-gray-700/40 px-2 py-0.5 rounded-full hover:bg-gray-800/70">GitHub</a>
          )}
          {socialLinks.tiktok && (
            <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="text-xs bg-fuchsia-900/30 text-fuchsia-400 border border-fuchsia-800/40 px-2 py-0.5 rounded-full hover:bg-fuchsia-900/50">TikTok</a>
          )}
        </div>
      )}

      {/* Contact info */}
      {hasContactInfo && (
        <div className="mt-3 space-y-1">
          {emails.map(function(email: string, i: number) {
            return <p key={i} className="text-xs text-pitch-accent">{email}</p>;
          })}
          {phones.map(function(phone: string, i: number) {
            return <p key={i} className="text-xs text-pitch-text-muted">{phone}</p>;
          })}
          {company.location && <p className="text-xs text-pitch-text-muted">{company.location}</p>}
        </div>
      )}

      {/* Scheduling link */}
      {company.schedulingLink && (
        <div className="mt-2">
          <a href={company.schedulingLink} target="_blank" rel="noopener noreferrer" className="text-xs text-pitch-accent hover:underline">
            Booking link found
          </a>
        </div>
      )}

      {/* Expandable details */}
      {hasEnrichment && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-pitch-accent hover:text-pitch-accent-hover mt-3 w-full text-left"
        >
          {expanded ? 'Show less' : 'Show more details'}
        </button>
      )}

      {expanded && (
        <div className="mt-3 space-y-4">
          {/* Team Members */}
          {teamMembers.length > 0 && (
            <div>
              <p className="text-[10px] text-pitch-text-muted uppercase font-semibold mb-1">Team ({teamMembers.length})</p>
              <div className="space-y-1">
                {teamMembers.map(function(m: any, i: number) {
                  return (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-pitch-text">{m.name} {m.role ? <span className="text-pitch-text-muted">- {m.role}</span> : ''}</span>
                      {m.linkedin && <a href={m.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">LinkedIn</a>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Customer Logos */}
          {customerLogos.length > 0 && (
            <div>
              <p className="text-[10px] text-pitch-text-muted uppercase font-semibold mb-1">Customers / Partners ({customerLogos.length})</p>
              <div className="flex flex-wrap gap-1">
                {customerLogos.map(function(logo: string, i: number) {
                  return <span key={i} className="text-[10px] bg-pitch-border px-1.5 py-0.5 rounded text-pitch-text-muted">{logo}</span>;
                })}
              </div>
            </div>
          )}

          {/* Recent Blog Posts */}
          {recentPosts.length > 0 && (
            <div>
              <p className="text-[10px] text-pitch-text-muted uppercase font-semibold mb-1">Recent Posts ({recentPosts.length})</p>
              <div className="space-y-1">
                {recentPosts.map(function(post: any, i: number) {
                  return (
                    <div key={i} className="text-xs">
                      {post.url ? (
                        <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-pitch-accent hover:underline">{post.title}</a>
                      ) : (
                        <span className="text-pitch-text">{post.title}</span>
                      )}
                      {post.date && <span className="text-pitch-text-muted ml-1">({post.date})</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Testimonials */}
          {testimonials.length > 0 && (
            <div>
              <p className="text-[10px] text-pitch-text-muted uppercase font-semibold mb-1">Testimonials ({testimonials.length})</p>
              <div className="space-y-1">
                {testimonials.map(function(t: string, i: number) {
                  return <p key={i} className="text-xs text-pitch-text-muted italic">"{t.substring(0, 150)}..."</p>;
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
