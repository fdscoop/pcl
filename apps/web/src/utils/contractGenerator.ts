/**
 * Contract HTML Template Generator
 * Generates professional contract HTML for storage and display
 */

export interface ContractGenerationData {
  contractId: string
  clubName: string
  clubLogo?: string
  clubEmail?: string
  clubPhone?: string
  clubCity?: string
  clubState?: string
  playerName: string
  playerId: string
  position: string
  jerseyNumber?: number
  startDate: string
  endDate: string
  monthlySalary?: number
  annualSalary?: number
  signingBonus?: number
  releaseClause?: number
  goalBonus?: number
  appearanceBonus?: number
  medicalInsurance?: number
  housingAllowance?: number
  contractStatus: string
  policies: ContractPolicy[]
  noticePeriod?: number
  trainingDaysPerWeek?: number
  clubSignatureName?: string
  clubSignatureTimestamp?: string
  playerSignatureName?: string
  playerSignatureTimestamp?: string
}

export interface ContractPolicy {
  type: string // 'anti_drug', 'general_terms', 'code_of_conduct', etc.
  title: string
  content: string
  isHighlight?: boolean // Red background for important policies
}

/**
 * Generate professional contract HTML
 */
export function generateContractHTML(data: ContractGenerationData): string {
  const formattedStartDate = formatDate(data.startDate)
  const formattedEndDate = formatDate(data.endDate)
  const contractDuration = calculateContractDuration(data.startDate, data.endDate)
  const totalSalary = data.monthlySalary ? data.monthlySalary * contractDuration : 0

  const policiesHTML = data.policies
    .map(policy => generatePolicySection(policy))
    .join('')

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Professional Football Player Contract - ${data.clubName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
        }

        .container {
            max-width: 1000px;
            margin: 20px auto;
            background: white;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }

        .header {
            border-bottom: 4px solid #1e3a8a;
            background: linear-gradient(to right, #f0f9ff, white);
            padding: 40px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .logo-section {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .logo-placeholder {
            width: 80px;
            height: 80px;
            border-radius: 8px;
            background: linear-gradient(135deg, #7dd3fc, #93c5fd);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
        }

        .logo-image {
            width: 80px;
            height: 80px;
            border-radius: 8px;
            object-fit: contain;
        }

        .club-info h1 {
            font-size: 28px;
            color: #1e3a8a;
            margin-bottom: 4px;
        }

        .club-info p {
            font-size: 14px;
            color: #64748b;
        }

        .contract-title {
            text-align: center;
            background: white;
            border: 2px solid #dbeafe;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 40px;
        }

        .contract-title h2 {
            font-size: 24px;
            color: #1e3a8a;
            margin-bottom: 8px;
        }

        .contract-title p {
            font-size: 12px;
            color: #64748b;
        }

        .player-highlight {
            background: linear-gradient(to right, #f97316, #fb923c);
            color: white;
            padding: 20px 40px;
            text-align: center;
            font-weight: bold;
            font-size: 18px;
        }

        .content {
            padding: 40px;
        }

        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #1e3a8a;
            margin-top: 30px;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 2px solid #f97316;
        }

        .parties-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }

        .party-box {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #1e3a8a;
        }

        .party-box.player {
            border-left-color: #f97316;
        }

        .party-box h4 {
            font-size: 16px;
            color: #1e3a8a;
            margin-bottom: 16px;
        }

        .party-box p {
            font-size: 13px;
            margin-bottom: 8px;
            line-height: 1.5;
        }

        .terms-box {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            font-size: 13px;
            line-height: 1.7;
        }

        .terms-box p {
            margin-bottom: 12px;
        }

        .financial-highlight {
            background: linear-gradient(to right, #1e3a8a, #f97316);
            color: white;
            padding: 30px;
            border-radius: 8px;
            margin: 30px 0;
            text-align: center;
        }

        .financial-amount {
            font-size: 36px;
            font-weight: bold;
            margin: 15px 0;
        }

        .financial-subtitle {
            font-size: 16px;
            opacity: 0.9;
        }

        .financial-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 30px 0;
        }

        .financial-box {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
        }

        .financial-box h4 {
            color: #1e3a8a;
            margin-bottom: 12px;
            font-size: 14px;
        }

        .financial-box p {
            font-size: 13px;
            margin-bottom: 8px;
        }

        .policy-section {
            margin: 30px 0;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #1e3a8a;
            background: #f8fafc;
        }

        .policy-section.highlight {
            background: linear-gradient(to right, #fecaca, #fca5a5);
            border-left-color: #dc2626;
            color: #7f1d1d;
        }

        .policy-section h4 {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 12px;
        }

        .policy-section.highlight h4 {
            color: #7f1d1d;
        }

        .policy-section p {
            font-size: 12px;
            line-height: 1.6;
            margin-bottom: 10px;
        }

        .signature-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 40px;
            padding-top: 30px;
            border-top: 2px solid #e2e8f0;
        }

        .signature-block {
            text-align: center;
        }

        .signature-line {
            border-top: 2px solid #333;
            margin-bottom: 10px;
            height: 60px;
            display: flex;
            align-items: flex-end;
            justify-content: center;
        }

        .signature-badge {
            display: inline-block;
            background: #dcfce7;
            border: 2px solid #22c55e;
            color: #15803d;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 10px;
        }

        .signature-name {
            font-weight: bold;
            margin-top: 10px;
            color: #1e3a8a;
        }

        .signature-title {
            font-size: 12px;
            color: #64748b;
        }

        .footer {
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            padding: 20px;
            border-top: 1px solid #e2e8f0;
            margin-top: 30px;
        }

        .unsign-indicator {
            color: #9ca3af;
            font-style: italic;
            font-size: 12px;
        }

        @media print {
            body {
                background: white;
            }
            .container {
                box-shadow: none;
                margin: 0;
            }
            .no-print {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="logo-section">
                ${data.clubLogo ? `<img src="${data.clubLogo}" alt="${data.clubName}" class="logo-image" />` : '<div class="logo-placeholder">⚽</div>'}
                <div class="club-info">
                    <h1>${data.clubName}</h1>
                    <p>Professional Football Club</p>
                </div>
            </div>
        </div>

        <!-- Contract Title -->
        <div class="contract-title">
            <h2>Professional Football Player Contract</h2>
            <p>Contract ID: ${data.contractId.slice(0, 8).toUpperCase()}...</p>
            <p>Date: ${formattedStartDate}</p>
        </div>

        <!-- Player Highlight -->
        <div class="player-highlight">
            🆔 PLAYER: ${data.playerName} | ID: ${data.playerId}
        </div>

        <!-- Main Content -->
        <div class="content">
            <!-- Contract Parties -->
            <h3 class="section-title">Contract Parties</h3>
            <div class="parties-grid">
                <div class="party-box">
                    <h4>THE CLUB</h4>
                    <p><strong>${data.clubName}</strong></p>
                    <p>Professional Football Club</p>
                    <p>${data.clubCity || 'City'}, ${data.clubState || 'State'}</p>
                    <p>Email: ${data.clubEmail || 'N/A'}</p>
                    <p>Phone: ${data.clubPhone || 'N/A'}</p>
                </div>
                <div class="party-box player">
                    <h4>THE PLAYER</h4>
                    <p><strong>${data.playerName}</strong></p>
                    <p><strong>Player ID:</strong> ${data.playerId}</p>
                    <p><strong>Position:</strong> ${data.position || 'N/A'}</p>
                    <p><strong>Jersey Number:</strong> #${data.jerseyNumber || 'N/A'}</p>
                </div>
            </div>

            <!-- Contract Terms -->
            <h3 class="section-title">Contract Terms</h3>
            <div class="terms-box">
                <p><strong>Contract Type:</strong> Professional Player Contract</p>
                <p><strong>Duration:</strong> ${formattedStartDate} to ${formattedEndDate}</p>
                <p><strong>Total Duration:</strong> ${contractDuration} months</p>
                <p><strong>Playing Position:</strong> ${data.position || 'N/A'}</p>
                <p><strong>Contract Status:</strong> ${data.contractStatus.toUpperCase()}</p>
            </div>

            <!-- Financial Terms -->
            <div class="financial-highlight">
                <h3 style="font-size: 22px; margin-bottom: 10px;">Financial Terms</h3>
                <div class="financial-amount">₹${formatCurrency(totalSalary)}</div>
                <p class="financial-subtitle">Total Contract Value | Monthly: ₹${formatCurrency(data.monthlySalary || 0)}</p>
            </div>

            <!-- Financial Breakdown -->
            <h3 class="section-title">Financial Breakdown</h3>
            <div class="financial-grid">
                <div class="financial-box">
                    <h4>Base Compensation</h4>
                    <p><strong>Monthly Salary:</strong> ₹${formatCurrency(data.monthlySalary || 0)}</p>
                    <p><strong>Annual Salary:</strong> ₹${formatCurrency(data.annualSalary || 0)}</p>
                    <p><strong>Total Contract Value:</strong> ₹${formatCurrency(totalSalary)}</p>
                </div>
                <div class="financial-box">
                    <h4>Additional Compensation</h4>
                    ${data.signingBonus ? `<p><strong>Signing Bonus:</strong> ₹${formatCurrency(data.signingBonus)}</p>` : ''}
                    ${data.goalBonus ? `<p><strong>Goal Bonus (Per Goal):</strong> ₹${formatCurrency(data.goalBonus)}</p>` : ''}
                    ${data.appearanceBonus ? `<p><strong>Appearance Bonus:</strong> ₹${formatCurrency(data.appearanceBonus)}</p>` : ''}
                </div>
                <div class="financial-box">
                    <h4>Benefits & Allowances</h4>
                    ${data.housingAllowance ? `<p><strong>Housing Allowance:</strong> ₹${formatCurrency(data.housingAllowance)}</p>` : ''}
                    ${data.medicalInsurance ? `<p><strong>Medical Insurance:</strong> ₹${formatCurrency(data.medicalInsurance)}</p>` : ''}
                    <p><strong>Training Days/Week:</strong> ${data.trainingDaysPerWeek || 'N/A'}</p>
                </div>
                <div class="financial-box">
                    <h4>Contract Terms</h4>
                    ${data.releaseClause ? `<p><strong>Release Clause:</strong> ₹${formatCurrency(data.releaseClause)}</p>` : ''}
                    ${data.noticePeriod ? `<p><strong>Notice Period:</strong> ${data.noticePeriod} days</p>` : ''}
                    <p><strong>Jersey Number:</strong> #${data.jerseyNumber || 'N/A'}</p>
                </div>
            </div>

            <!-- Policies -->
            ${policiesHTML}

            <!-- Signature Section -->
            <h3 class="section-title">Contract Signatures</h3>
            <div class="signature-section">
                <div class="signature-block">
                    ${data.clubSignatureName && data.clubSignatureTimestamp ? `
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                        <span style="font-size: 20px; color: #22c55e;">✅</span>
                        <span style="font-size: 13px; color: #22c55e; font-weight: 600;">Digitally signed by</span>
                    </div>
                    <p class="signature-name">${data.clubName}</p>
                    <p style="font-size: 12px; color: #475569; margin: 4px 0;">Signed by: ${data.clubSignatureName}</p>
                    <p class="signature-title">Club Representative</p>
                    <p style="font-size: 11px; color: #64748b; margin-top: 8px;">
                        Signed on: ${new Date(data.clubSignatureTimestamp).toLocaleDateString('en-IN')}
                    </p>
                    ` : `
                    <div class="signature-line"></div>
                    <p class="signature-name">${data.clubName}</p>
                    <p class="signature-title">Club Representative</p>
                    <p class="unsign-indicator">Awaiting signature...</p>
                    `}
                </div>
                <div class="signature-block">
                    ${data.playerSignatureName && data.playerSignatureTimestamp ? `
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                        <span style="font-size: 20px; color: #22c55e;">✅</span>
                        <span style="font-size: 13px; color: #22c55e; font-weight: 600;">Digitally signed by</span>
                    </div>
                    <p class="signature-name">${data.playerName}</p>
                    <p style="font-size: 12px; color: #475569; margin: 4px 0;">Signed by: ${data.playerSignatureName}</p>
                    <p class="signature-title">Professional Player</p>
                    <p style="font-size: 11px; color: #64748b; margin-top: 8px;">
                        Signed on: ${new Date(data.playerSignatureTimestamp).toLocaleDateString('en-IN')}
                    </p>
                    ` : `
                    <div class="signature-line"></div>
                    <p class="signature-name">${data.playerName}</p>
                    <p class="signature-title">Professional Player</p>
                    <p class="unsign-indicator">Awaiting signature...</p>
                    `}
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p>This contract is governed by professional football league regulations</p>
                <p>Generated on ${new Date().toLocaleDateString('en-IN')} | Contract ID: ${data.contractId.slice(0, 8).toUpperCase()}</p>
                <p>Professional Club League © 2025 | Drug-Free Sport Initiative</p>
            </div>
        </div>
    </div>
</body>
</html>
  `

  return html.trim()
}

/**
 * Generate individual policy section HTML
 */
function generatePolicySection(policy: ContractPolicy): string {
  const highlightClass = policy.isHighlight ? ' highlight' : ''

  return `
    <div class="policy-section${highlightClass}">
        <h4>${policy.title}</h4>
        ${policy.content.split('\n').map(line => `<p>${line.trim()}</p>`).join('')}
    </div>
  `
}

/**
 * Format date to readable format
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

/**
 * Calculate contract duration in months
 */
export function calculateContractDuration(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  // Calculate the number of months including partial months
  const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                 (end.getMonth() - start.getMonth())
  
  // Add 1 if the end day is >= start day (to include the end month)
  const days = end.getDate() - start.getDate()
  const totalMonths = days >= 0 ? months + 1 : months
  
  return Math.max(1, totalMonths)
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Get default PCL policies
 */
export function getDefaultPCLPolicies(): ContractPolicy[] {
  return [
    {
      type: 'general_terms',
      title: 'General Terms & Conditions',
      content: `1. Contract Binding: This contract is legally binding upon both parties and governed by professional football league regulations.

2. Medical Requirements: Player must maintain physical fitness standards as defined by club medical staff and undergo regular medical examinations.

3. Training & Discipline: Player agrees to attend all scheduled training sessions, matches, and club activities unless excused by management for valid reasons.

4. Code of Conduct: Player must maintain professional behavior on and off the field, upholding the reputation and values of the club.

5. Anti-Drug Policy: Player commits to a drug-free lifestyle and agrees to support anti-drug campaigns as promoted by the Government of India and club initiatives.

6. Injury & Insurance: Club provides comprehensive medical coverage for football-related injuries during official training and matches.

7. Termination Clause: Either party may terminate this contract with 30 days written notice, subject to financial settlements as per league regulations.

8. Transfer Clause: Player transfers are subject to release clause payment and mutual agreement between all parties involved.

9. Intellectual Property: Any content created during employment belongs to the club unless otherwise specified.

10. Compliance & Legal: Player agrees to comply with all applicable laws, regulations, and government policies, including Indian anti-drug legislation.`
    },
    {
      type: 'anti_drug',
      title: '🚫 ANTI-DRUG POLICY & COMPLIANCE',
      content: `ZERO TOLERANCE POLICY: PCL maintains a strict zero-tolerance policy regarding the use, possession, distribution, or promotion of illegal drugs, narcotics, or banned substances.

INDIAN GOVERNMENT COMPLIANCE: This contract is executed in full compliance with the Government of India's anti-drug initiatives and policies. The player acknowledges and supports the nation's efforts to maintain a drug-free society.

MANDATORY TESTING: The player agrees to undergo regular drug testing as required by the club, league regulations, and government authorities.

BREACH CONSEQUENCES: Any violation of this anti-drug policy will result in immediate contract termination, forfeiture of all benefits, and cooperation with law enforcement authorities as required by law.`,
      isHighlight: true
    }
  ]
}

/**
 * Export contract to PDF (requires external library like html2pdf)
 */
export function exportContractToPDF(html: string, filename: string): void {
  // This requires html2pdf or similar library to be installed
  // Import and use: import html2pdf from 'html2pdf.js'
  console.log('PDF export requires html2pdf library to be installed')
  console.log(`Would export: ${filename}`)
}

/**
 * Print contract directly
 */
export function printContract(html: string): void {
  const printWindow = window.open('', '', 'height=600,width=800')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }
}
