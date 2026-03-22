export const roleSkillMap: Record<string, string[]> = {
  "plc": ["Siemens TIA Portal", "Allen-Bradley Studio 5000", "SCADA", "HMI Design", "Ladder Logic", "VFD Configuration", "Industrial Networking", "Process Instrumentation"],
  "automation": ["Siemens TIA Portal", "Allen-Bradley", "SCADA Systems", "HMI Design", "Industrial IoT", "Robotics Programming", "Process Control", "Instrumentation"],
  "software": ["JavaScript", "Python", "React", "Node.js", "SQL", "Git", "Docker", "AWS"],
  "full stack": ["JavaScript", "TypeScript", "React", "Node.js", "Next.js", "MongoDB", "PostgreSQL", "REST APIs", "Git", "Docker"],
  "frontend": ["JavaScript", "TypeScript", "React", "Vue.js", "CSS/SCSS", "HTML5", "Tailwind CSS", "Figma", "Git", "Responsive Design"],
  "backend": ["Python", "Java", "Node.js", "SQL", "PostgreSQL", "Redis", "Docker", "AWS", "Microservices", "REST APIs"],
  "data sci": ["Python", "SQL", "TensorFlow", "Pandas", "Scikit-learn", "R", "Tableau", "Statistics"],
  "data engineer": ["Python", "SQL", "Apache Spark", "Airflow", "Kafka", "AWS/GCP", "ETL Pipelines", "Data Warehousing", "Hadoop", "dbt"],
  "nurse": ["Patient Assessment", "IV Therapy", "Electronic Health Records", "CPR/BLS", "Medication Administration"],
  "teacher": ["Curriculum Development", "Classroom Management", "Assessment Design", "Differentiated Instruction"],
  "mechanic": ["AutoCAD", "SolidWorks", "GD&T", "CNC Programming", "Thermodynamics", "FEA"],
  "market": ["SEO", "Google Analytics", "Content Strategy", "Social Media", "Email Marketing", "PPC", "HubSpot"],
  "account": ["QuickBooks", "SAP", "Tax Preparation", "GAAP", "Financial Reporting", "Excel"],
  "product": ["Roadmapping", "User Research", "Agile/Scrum", "JIRA", "Wireframing", "A/B Testing"],
  "design": ["Figma", "User Research", "Prototyping", "Usability Testing", "Design Systems"],
  "devops": ["Docker", "Kubernetes", "Terraform", "CI/CD", "AWS", "Linux", "Monitoring"],
  "sales": ["CRM", "Salesforce", "Cold Outreach", "Negotiation", "Pipeline Management"],
  "hr": ["Recruiting", "HRIS", "Employee Relations", "Performance Management", "Compliance"],
  "electrical": ["MATLAB", "PCB Design", "Power Systems", "Circuit Analysis", "PLC Programming"],
  "civil": ["AutoCAD Civil 3D", "STAAD Pro", "Surveying", "Structural Analysis", "Project Management"],
  "pharma": ["GMP", "HPLC", "Quality Control", "Regulatory Affairs", "Documentation"],
  "chef": ["Menu Development", "Food Safety", "Inventory Management", "HACCP", "Cost Control"],
  "legal": ["Legal Research", "Contract Drafting", "Litigation", "Compliance", "Due Diligence"],
  "architect": ["AutoCAD", "Revit", "SketchUp", "Building Codes", "3D Modeling"],
  "logistics": ["Supply Chain", "Warehouse Management", "SAP", "Inventory Control", "ERP"],
  "finance": ["Financial Modeling", "Excel", "Bloomberg Terminal", "Risk Analysis", "Valuation"],
  "project": ["PMP", "Agile", "MS Project", "Risk Management", "Stakeholder Management"],
  "ux": ["Figma", "User Research", "Wireframing", "Prototyping", "Usability Testing"],
  "web": ["HTML", "CSS", "JavaScript", "React", "Node.js", "TypeScript", "Tailwind CSS"],
  "mobile": ["React Native", "Swift", "Kotlin", "Flutter", "Firebase", "REST APIs"],
  "qa": ["Selenium", "Jest", "Cypress", "JIRA", "Test Planning", "API Testing"],
  "network": ["Cisco", "TCP/IP", "Firewalls", "VPN", "Network Security", "CCNA"],
  "cloud": ["AWS", "Azure", "GCP", "Terraform", "Docker", "Kubernetes", "Serverless"],
  "machine learn": ["Python", "TensorFlow", "PyTorch", "NLP", "Computer Vision", "MLOps"],
  "cyber": ["Penetration Testing", "SIEM", "Incident Response", "Compliance", "Vulnerability Assessment"],
  "ai engineer": ["Python", "PyTorch", "TensorFlow", "NLP", "Computer Vision", "MLOps", "LangChain", "Fine-tuning", "RAG", "Vector Databases"],
  "graphic designer": ["Adobe Photoshop", "Illustrator", "InDesign", "Figma", "Typography", "Branding", "Print Design", "Color Theory", "Motion Graphics"],
  "content writer": ["SEO Writing", "Copywriting", "Blog Writing", "Technical Writing", "Social Media Content", "Content Strategy", "Editing", "Research", "WordPress"],
};

export function getSkillSuggestions(targetRole: string): string[] {
  if (!targetRole) {
    return ["Communication", "Problem Solving", "Project Management", "Microsoft Office", "Teamwork", "Leadership"];
  }
  const normalized = targetRole.toLowerCase();
  for (const [key, skills] of Object.entries(roleSkillMap)) {
    if (normalized.includes(key) || key.includes(normalized.split(' ')[0])) {
      return skills;
    }
  }
  // Fallback to generic professional skills
  return ["Communication", "Problem Solving", "Project Management", "Microsoft Office", "Teamwork", "Leadership"];
}
