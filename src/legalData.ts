// src/legalData.ts
// Single source of truth for ChargeLink GH Legal, Terms of Service & Privacy Policy

export interface LegalSection {
  id: string;
  title: string;
  badge?: string;
  isWarning?: boolean;
  content: string[];
}

export const LEGAL_LAST_UPDATED = 'September 2024 (Edition 4.2)';
export const LEGAL_ENTITY_NAME = 'CHARGELINK GH LTD';
export const LEGAL_JURISDICTION = 'Republic of Ghana';
export const LEGAL_CONTACT_EMAIL = 'legal@chargelink.africa';
export const LEGAL_STATION_HQ = 'Opoku Bandoh Plaza, Asokwa Newroad, Eastern Bypass, Kumasi, Ashanti, Ghana';

export const TERMS_OF_SERVICE: LegalSection[] = [
  {
    id: 'intro',
    title: '1. Introduction & Binding Agreement',
    badge: 'LEGAL BINDING',
    content: [
      `These Terms of Service ("Terms") constitute a legally binding agreement between you ("Driver", "User", "Fleet Operator") and ${LEGAL_ENTITY_NAME} ("ChargeLink GH", "we", "us", or "our"), governing your access to and use of the ChargeLink GH electric vehicle (EV) charging stations, high-voltage dispensing hardware, mobile application, web progressive web app (PWA), telemetry network, and digital wallet services (collectively, the "Platform").`,
      `By registering an account, providing your Ghanaian mobile telephone number, linking an electric vehicle, authorizing a Mobile Money pre-authorization escrow, connecting a charging cable to an electric vehicle, or tapping an RFID card on any ChargeLink GH hardware terminal, you expressly acknowledge that you have read, understood, and agree to be bound by all terms, conditions, disclaimers, and liability waivers contained herein.`,
      `If you do not agree to these Terms in their entirety, you must immediately cease all access to the Platform, disconnect your vehicle, and refrain from utilizing ChargeLink GH charging hardware.`
    ]
  },
  {
    id: 'eligibility',
    title: '2. User Eligibility & Account Telemetry Node',
    content: [
      `You must be at least eighteen (18) years of age and hold a valid, unexpired driver's license issued by the Driver and Vehicle Licensing Authority (DVLA) of Ghana or a recognized international licensing authority to operate charging equipment connected to a motor vehicle on the Platform.`,
      `Your account is tied to your primary verified Ghanaian mobile MSISDN (+233 prefix) authenticated via one-time cryptographic passcodes transmitted through Moolre SMS gateway. You are strictly responsible for maintaining physical control of your mobile device and security codes. Any charging session, wallet top-up, or escrow debit initiated through your verified mobile node is conclusively deemed authorized by you.`
    ]
  },
  {
    id: 'safety',
    title: '3. High-Voltage EV Charging Safety & User Responsibilities',
    badge: 'CRITICAL SAFETY',
    isWarning: true,
    content: [
      `HAZARDOUS VOLTAGE WARNING: ChargeLink GH DC fast-charging stations (including the MaxPower VCP160 unit and ultra-fast dispensers) supply hazardous, direct current (DC) electrical energy up to 160 kW to 350 kW at electrical potentials exceeding 400V to 1000V DC, alongside high-power alternating current (AC). High electrical power poses severe risks of electric shock, electrocution, arc flash, thermal burns, explosion, and property destruction if misused.`,
      `Driver Operational Protocol: You agree to operate all charging equipment strictly in accordance with on-screen terminal instructions, manufacturer EV guidelines, and safety notices:`,
      `a) Certified Vehicle Inlets Only: You may only insert ChargeLink GH charging connectors (CCS2, GB/T, Type 2, CHAdeMO) into factory-certified, undamaged charging ports of roadworthy passenger EVs or electric fleet vehicles.`,
      `b) Prohibition of Aftermarket Adapters: You shall NOT use home-made, uncertified, damaged, or unapproved third-party plug adapters, DIY extension cables, or converters. Any use of non-OEM adapters is conducted entirely at your sole risk and immediately voids all liability of ChargeLink GH.`,
      `c) Mechanical Interlocks: Charging cables are mechanically locked into your vehicle's charge port upon session authorization. You must NEVER yank, jerk, force, or tamper with a latched connector while energized. The connector will automatically release when the charging session is stopped via the app or terminal emergency stop.`,
      `d) Drive-Off Damage & Strict Driver Liability: Before entering your vehicle and driving away, you MUST visually verify that the charging connector has been unlatched and safely returned to its dispenser holster. Drivers who drive off with charging cables attached are strictly and 100% liable for all repair, replacement, structural, and downtime costs incurred by ChargeLink GH and third parties.`,
      `e) Environmental Hazards: Do not handle charging plugs with wet hands during severe electrical lightning storms or when standing in submerged pooled floodwaters.`
    ]
  },
  {
    id: 'battery',
    title: '4. Vehicle Traction Battery & Pre-Existing Conditions Disclaimer',
    badge: 'BATTERY DISCLAIMER',
    content: [
      `ChargeLink GH delivers electrical energy compliant with international Open Charge Point Protocol (OCPP 1.6J / 2.0.1) and vehicle communication protocols (ISO 15118, DIN 70121, GB/T 27930). The actual charging rate, power acceptance curve, voltage, and current delivered are at all times governed and regulated by your vehicle's internal onboard Battery Management System (BMS).`,
      `Battery Degradation Disclaimer: Fast DC charging inherently creates thermal and chemical stress on lithium-ion traction batteries. ChargeLink GH expressly disclaims any liability for:`,
      `a) Natural, normal, or accelerated battery degradation, reduction in vehicle range, or loss of kilowatt-hour storage capacity.`,
      `b) Thermal runaway, cell overheating, fire, or internal BMS shutdown resulting from pre-existing vehicle defects, compromised cooling systems, damaged battery packs, or aftermarket modifications.`,
      `c) User-Configured Limits: The software provides target State of Charge (SoC) limit sliders (e.g. 80% Daily Commute vs 100% Road Trip). While recommended for battery longevity, these limits are assistive tools and you remain solely responsible for your battery's charging limits.`
    ]
  },
  {
    id: 'grid',
    title: '5. Electrical Grid Fluctuations & Power Outages (ECG / GRIDCo)',
    content: [
      `Charging stations rely upon electrical power supplied by the Electricity Company of Ghana (ECG), the Ghana Grid Company (GRIDCo), and local distribution infrastructure.`,
      `ChargeLink GH is NOT responsible or liable for any charging session interruptions, sudden power drops, blackouts, voltage sags, brownouts, surges, or phase failures caused by utility grid outages, load shedding ("dumsor"), or public utility switching operations.`,
      `In the event of an upstream grid outage during an active session, ChargeLink GH's automated backend safely terminates the session and immediately calculates billing based only on kilowatt-hours dispensed prior to the interruption.`
    ]
  },
  {
    id: 'tariffs',
    title: '6. Tariffs, Pre-Authorization Escrow & Ghana Cedi Currency',
    badge: 'CURRENCY: GH₵ ONLY',
    content: [
      `All tariffs, wallet balances, pre-authorization security deposits, and idle parking penalties are strictly denominated in Ghana Cedis (GH₵ / GHS).`,
      `Energy Tariff: Energy is metered and billed per kilowatt-hour (GH₵/kWh) as published in the app and on the terminal rate card prior to session start. Initial Greenwood Event Center baseline tariff is GH₵ 4.50 per kWh (subject to change with prior in-app notice).`,
      `Pre-Authorization Escrow Hold: Upon tapping "Start Charging" or "Unlock Connector", the system locks a temporary pre-authorization hold (typically GH₵ 20.00 to GH₵ 25.00) from your available wallet balance. This hold guarantees session settlement.`,
      `Programmatic Difference Refund: When your session stops, the exact energy delivered is computed down to the pesewa (kWh dispensed × tariff). Any unspent portion of the escrow hold is automatically released and credited back to your available wallet balance immediately.`,
      `Non-Refundable Energy: Electrical energy that has been transferred into your vehicle's battery pack has been consumed and is strictly non-refundable.`
    ]
  },
  {
    id: 'idle',
    title: '7. Automated Idle Parking Fees & Bay Availability',
    badge: 'IDLE FEES APPLY',
    isWarning: true,
    content: [
      `Charging bays at ChargeLink GH stations (such as Greenwood Event Center) are reserved strictly for vehicles actively receiving electric charge, not for general parking.`,
      `5-Minute Grace Period: When your vehicle completes charging (either reaching 100% SoC, your user-defined target SoC, or when disconnected by BMS), you are granted a five (5) minute grace period to unplug your vehicle and vacate the charging bay.`,
      `Idle Penalty Rate: If your vehicle remains parked in the charging bay after the 5-minute grace period has expired, an automated idle fee of GH₵ 0.50 per minute is billed against your wallet or linked payment method, up to a maximum cap of GH₵ 10.00 per session.`,
      `Towing Rights: Vehicles remaining parked in charging bays for more than sixty (60) minutes after charging completion without driver presence may be towed at the owner's sole expense and risk in coordination with local facility management.`
    ]
  },
  {
    id: 'momo',
    title: '8. Mobile Money (MoMo) & Payment Switch Integration',
    content: [
      `ChargeLink GH processes mobile wallet transactions through licensed Ghanaian payment gateways supporting MTN Mobile Money (*170#), Telecel Cash (*110#), AT Money, and Mastercard 3D Secure debit. Merchant identity appears as CHARGELINK GH LTD.`,
      `USSD Security: You must never disclose your private 4-digit or 6-digit Mobile Money PIN to any individual. All PIN entry occurs strictly within the official telecom USSD system dialog prompt generated by your mobile network operator. ChargeLink GH staff will NEVER request your Mobile Money PIN.`,
      `Network Delays: ChargeLink GH is not liable for telecom carrier downtime, SMS delivery delays, USSD session timeouts, or carrier-side wallet holds initiated by MTN, Telecel, or your banking institution.`
    ]
  },
  {
    id: 'liability',
    title: '9. Limitation of Liability & Indemnification Waiver',
    badge: 'MAXIMUM EXCLUSION',
    isWarning: true,
    content: [
      `TO THE MAXIMUM EXTENT PERMITTED UNDER THE LAWS OF THE REPUBLIC OF GHANA:`,
      `a) IN NO EVENT SHALL CHARGELINK GH LTD, ITS DIRECTORS, SHAREHOLDERS, EMPLOYEES, CONTRACTORS, OR STATION SITE HOSTS (INCLUDING GREENWOOD EVENT CENTER AND OPOKU BANDOH PLAZA) BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO VEHICLE TOWING COSTS, BATTERY REPLACEMENT EXPENSES, LOSS OF COMMERCIAL REVENUE, TRAVEL DELAYS, OR ALTERNATIVE TRANSPORTATION EXPENSES.`,
      `b) TOTAL AGGREGATE LIABILITY: UNDER NO CIRCUMSTANCES SHALL CHARGELINK GH LTD'S TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO YOUR USE OF THE SERVICE EXCEED THE TOTAL FEES PAID BY YOU TO CHARGELINK GH LTD IN THE THIRTY (30) DAYS IMMEDIATELY PRECEDING THE CLAIM, OR ONE HUNDRED GHANA CEDIS (GH₵ 100.00), WHICHEVER IS LESS.`,
      `c) Indemnification: You agree to defend, indemnify, and hold harmless CHARGELINK GH LTD, its officers, employees, and station property owners from any third-party claims, liabilities, damages, fines, and legal fees arising from your physical misuse of charging equipment, drive-off incidents, non-compliant adapters, or violation of these Terms.`
    ]
  },
  {
    id: 'disputes',
    title: '10. Governing Law, Arbitration & Class Action Waiver',
    content: [
      `These Terms shall be governed by, construed, and enforced in accordance with the laws of the Republic of Ghana, without regard to conflict of law principles.`,
      `Mandatory Amicable Negotiation: Prior to initiating formal dispute proceedings, the parties agree to engage in good-faith negotiations for a minimum period of thirty (30) days following written notice sent to ${LEGAL_CONTACT_EMAIL}.`,
      `Binding Arbitration: Any dispute, claim, or controversy that cannot be resolved amicably shall be submitted to final and binding arbitration in Kumasi or Accra, Ghana, administered under the Alternative Dispute Resolution Act, 2010 (Act 798) of Ghana.`,
      `Class Action Waiver: You agree that all disputes must be resolved on an individual basis only. You expressly waive any right to bring or participate in any class action, collective lawsuit, or representative proceeding against ChargeLink GH.`
    ]
  }
];

export const PRIVACY_POLICY: LegalSection[] = [
  {
    id: 'act843',
    title: '1. Compliance with Ghana Data Protection Act, 2012 (Act 843)',
    badge: 'ACT 843 COMPLIANT',
    content: [
      `CHARGELINK GH LTD operates as a registered Data Controller under the Data Protection Act, 2012 (Act 843) of the Republic of Ghana. We are committed to upholding the statutory data protection principles regarding lawful processing, minimization, security integrity, purpose specification, and data subject participation.`,
      `This Privacy Policy explains how we collect, process, store, synchronize, and safeguard your personal information across our mobile app, web PWA, and charging station hardware.`
    ]
  },
  {
    id: 'data_collected',
    title: '2. Information We Collect & Telemetry Data',
    content: [
      `We collect only data necessary to provision EV charging, secure payments, and maintain network telemetry:`,
      `a) Identity & Contact Information: Your verified Ghanaian mobile phone number (MSISDN), full name, email address for charging invoices, and optional Ghana Card PIN (for commercial fleet tax compliance).`,
      `b) Vehicle & Garage Profile: Vehicle make, model, year, vehicle identification number (VIN), license plate, connector type, and battery capacity (kWh).`,
      `c) Charging Session Telemetry (OCPP): Real-time meter values, energy delivered (kWh), instantaneous power (kW), pack voltage, current, duration, session timestamps, station identifier, and connector ID.`,
      `d) Financial & Ledger Records: Wallet balance, top-up amounts, MoMo transaction references, and pre-auth escrow logs. (Note: ChargeLink GH NEVER collects or stores your private Mobile Money or banking PINs).`,
      `e) Geolocation Telemetry: Live GPS coordinates provided with your permission to identify nearby fast chargers, calculate distances, and provide turn-by-turn navigation.`
    ]
  },
  {
    id: 'purpose',
    title: '3. Lawful Purpose & Basis for Processing',
    content: [
      `We process your personal data under the lawful bases recognized by Act 843:`,
      `a) Performance of Contract: Initiating electrical energy delivery, locking/unlocking connectors, managing escrow deposits, and settling transactions.`,
      `b) Statutory & Tax Compliance: Issuing valid Ghana Revenue Authority (GRA) compliant tax receipts, maintaining audit logs for mandatory statutory periods.`,
      `c) Network Security & Fraud Prevention: Monitoring station telemetry for physical tampering, illegal bypasses, or cyber threats.`,
      `d) Legitimate Business Operations: Optimizing station power distribution during peak grid hours across the Kumasi and Accra corridors.`
    ]
  },
  {
    id: 'third_parties',
    title: '4. Third-Party Service Providers & Data Processors',
    content: [
      `We do not sell, rent, or monetize your personal data. We disclose information solely to authorized service providers bound by strict confidentiality and data protection agreements:`,
      `a) Telephony & SMS Gateways: Moolre Ghana (transmitting one-time passcodes and charging receipts via SMS).`,
      `b) Payment Switches: Mobile Network Operators (MTN Ghana MoMo, Telecel Ghana Cash, AT Money) and card processing switches for payment validation.`,
      `c) Mapping & Navigation: Google Maps and OpenStreetMap for route guidance.`,
      `d) Regulatory Authorities: Ghanaian law enforcement or the Energy Commission when required by valid court order or statutory requirement.`
    ]
  },
  {
    id: 'security_retention',
    title: '5. Data Security & Retention Schedules',
    badge: '256-BIT ENCRYPTION',
    content: [
      `Security Architecture: All telemetry and personal data transmitted between mobile devices, servers, and physical charging hardware is protected using industry-standard TLS/SSL encryption (HTTPS and WSS protocols) with 256-bit cryptographic keys. Local multi-user files are stored with atomic write-locks to prevent data corruption.`,
      `Retention Schedule: Account data is retained for as long as your account remains active. In compliance with Ghanaian tax and commercial legislation, transaction records and financial invoices are retained for six (6) years following transaction completion.`
    ]
  },
  {
    id: 'user_rights',
    title: '6. Your Rights under Act 843 & Contact Information',
    content: [
      `Under the Data Protection Act, 2012 (Act 843), you have the right to:`,
      `a) Request access to personal information held about you by ChargeLink GH.`,
      `b) Request correction of inaccurate, outdated, or incomplete vehicle or profile information.`,
      `c) Request deletion of your account and personal data (subject to mandatory legal retention requirements for financial audits).`,
      `d) Lodge a complaint with the Data Protection Commission (DPC) of Ghana if you believe your data privacy rights have been infringed.`,
      `For any data privacy inquiries, requests, or notices, contact our Data Protection Officer at: ${LEGAL_CONTACT_EMAIL} or visit our registered station office at ${LEGAL_STATION_HQ}.`
    ]
  }
];
