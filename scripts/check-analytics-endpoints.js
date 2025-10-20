/**
 * Check Analytics Endpoints
 * Directly query the database to see what each analytics service returns
 */

import { getTherapistDistribution, getTherapyTypeBreakdown, getSpecializationBreakdown } from '../server/services/therapistAnalytics';
import { getSupplyDemandAnalysis } from '../server/services/businessIntelligence';

async function checkEndpoints() {
  console.log('🔍 Checking analytics endpoints...\n');

  try {
    // Check Therapist Distribution
    console.log('1. Therapist Distribution:');
    const distribution = await getTherapistDistribution();
    console.log(`   Results: ${distribution.length} records`);
    if (distribution.length > 0) {
      console.log('   Sample:', distribution.slice(0, 3));
    }

    // Check Therapy Types
    console.log('\n2. Therapy Types Breakdown:');
    const therapyTypes = await getTherapyTypeBreakdown();
    console.log(`   Results: ${therapyTypes.length} records`);
    if (therapyTypes.length > 0) {
      console.log('   Sample:', therapyTypes.slice(0, 3));
    }

    // Check Specializations
    console.log('\n3. Specializations Breakdown:');
    const specializations = await getSpecializationBreakdown();
    console.log(`   Results: ${specializations.length} records`);
    if (specializations.length > 0) {
      console.log('   Sample:', specializations.slice(0, 3));
    }

    // Check Supply/Demand
    console.log('\n4. Supply/Demand Analysis:');
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const supplyDemand = await getSupplyDemandAnalysis(startDate, endDate);
    console.log(`   Results: ${supplyDemand.length} records`);
    if (supplyDemand.length > 0) {
      console.log('   Sample:', supplyDemand.slice(0, 3));
    }

    console.log('\n✅ Endpoint check complete!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }

  process.exit(0);
}

checkEndpoints().catch(error => {
  console.error('💥 Check failed:', error);
  process.exit(1);
});
