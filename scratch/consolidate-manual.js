const fs = require('fs');
const path = require('path');

const baseDir = 'docs/RENTipid-Master-Manual';
const parts = [
  '00-Front-Matter/00-Front-Matter.md',
  '01-User-Manual/01-Executive-Overview.md',
  '01-User-Manual/02-System-Scope-Boundaries.md',
  '01-User-Manual/03-Roles-Access.md',
  '01-User-Manual/04-Account-Lifecycle.md',
  '01-User-Manual/05-Renter-User-Manual.md',
  '01-User-Manual/06-Booking-and-Rental-Process.md',
  '02-Provider-Manual/07-Provider-User-Manual.md',
  '03-Operations/13-Administrative-Manual.md',
  '03-Operations/14-Finance-Operations.md',
  '04-Security-and-Compliance/15-Compliance-Trust-Safety.md',
  '04-Security-and-Compliance/16-Security-Operations-Center.md',
  '05-AI-and-Social/17-AI-Assistant.md',
  '05-AI-and-Social/18-Social-Media-Promotion.md',
  '06-Architecture-and-Mobile/19-Mobile-Application-PWA.md',
  '06-Architecture-and-Mobile/20-Technical-Architecture.md',
  '07-Database-and-APIs/21-Database-Manual.md',
  '07-Database-and-APIs/22-API-and-Services.md',
  '08-Workflows-and-Environment/23-Workflows-and-State-Machines.md',
  '08-Workflows-and-Environment/24-Configuration-and-Environment.md',
  '09-Testing-and-Deployment/25-Testing-and-QA.md',
  '09-Testing-and-Deployment/26-Deployment-and-Operations.md',
  '10-History-and-Governance/27-History-and-Governance.md',
  '10-History-and-Governance/28-Troubleshooting-and-Training.md',
  '11-Consolidation/31-Diagrams-and-Quick-Guides.md'
];

let masterContent = '';
for (const part of parts) {
  const fullPath = path.join(baseDir, part);
  if (fs.existsSync(fullPath)) {
    masterContent += fs.readFileSync(fullPath, 'utf-8') + '\n\n---\n\n';
  } else {
    console.error(`Missing file: ${fullPath}`);
  }
}

fs.writeFileSync(path.join(baseDir, 'RENTipid_Master_Manual.md'), masterContent);
console.log('Master Manual Successfully Consolidated!');
