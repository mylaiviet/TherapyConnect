/**
 * Test API Analytics Functions Directly
 *
 * This script tests all the analytics service functions to see what data
 * they actually return, without going through the HTTP layer.
 */

import * as therapistAnalytics from '../server/services/therapistAnalytics';
import * as businessIntelligence from '../server/services/businessIntelligence';
import { db } from '../server/db';
import { therapists } from '../shared/schema';
import { eq, count } from 'drizzle-orm';

async function testAnalyticsFunctions() {
  console.log('🔍 Testing Analytics Service Functions Directly\n');
  console.log('=' .repeat(60));

  try {
    // First, verify we have therapists in the database
    console.log('\n📊 STEP 1: Verify Database Has Therapists');
    console.log('-'.repeat(60));

    const totalTherapists = await db
      .select({ count: count() })
      .from(therapists)
      .where(eq(therapists.profileStatus, 'approved'));

    console.log(`✅ Total approved therapists: ${totalTherapists[0].count}`);

    if (Number(totalTherapists[0].count) === 0) {
      console.error('❌ ERROR: No approved therapists found in database!');
      process.exit(1);
    }

    // Test 1: Therapist Distribution
    console.log('\n\n📍 STEP 2: Test getTherapistDistribution()');
    console.log('-'.repeat(60));

    const distribution = await therapistAnalytics.getTherapistDistribution();
    console.log(`Result: ${distribution.length} city groups`);

    if (distribution.length === 0) {
      console.error('❌ ERROR: getTherapistDistribution() returned EMPTY ARRAY!');
      console.error('This is the root cause - the function is not returning data.');
    } else {
      console.log('✅ SUCCESS: Function returns data!');
      console.log('\nFirst 5 results:');
      distribution.slice(0, 5).forEach((d, i) => {
        console.log(`  ${i + 1}. ${d.city}, ${d.state}: ${d.totalTherapists} therapists (${d.activeTherapists} active)`);
      });

      const total = distribution.reduce((sum, d) => sum + d.totalTherapists, 0);
      console.log(`\nTotal therapists across all groups: ${total}`);
    }

    // Test 2: Therapy Types
    console.log('\n\n💼 STEP 3: Test getTherapyTypeBreakdown()');
    console.log('-'.repeat(60));

    const therapyTypes = await therapistAnalytics.getTherapyTypeBreakdown();
    console.log(`Result: ${therapyTypes.length} therapy types`);

    if (therapyTypes.length === 0) {
      console.error('❌ WARNING: No therapy types found');
    } else {
      console.log('✅ First 3 types:');
      therapyTypes.slice(0, 3).forEach((t, i) => {
        console.log(`  ${i + 1}. ${t.therapyType}: ${t.therapistCount} therapists`);
      });
    }

    // Test 3: Specializations
    console.log('\n\n🎯 STEP 4: Test getSpecializationBreakdown()');
    console.log('-'.repeat(60));

    const specializations = await therapistAnalytics.getSpecializationBreakdown();
    console.log(`Result: ${specializations.length} specializations`);

    if (specializations.length === 0) {
      console.error('❌ WARNING: No specializations found');
    } else {
      console.log('✅ First 3 specializations:');
      specializations.slice(0, 3).forEach((s, i) => {
        console.log(`  ${i + 1}. ${s.specialty}: ${s.therapistCount} therapists`);
      });
    }

    // Test 4: Growth Metrics
    console.log('\n\n📈 STEP 5: Test getGrowthMetrics()');
    console.log('-'.repeat(60));

    const growth = await therapistAnalytics.getGrowthMetrics();
    console.log(`New this month: ${growth.newTherapistsThisMonth}`);
    console.log(`New last month: ${growth.newTherapistsLastMonth}`);
    console.log(`Growth rate: ${growth.growthRate.toFixed(2)}%`);
    console.log(`Monthly growth records: ${growth.monthlyGrowth.length}`);

    // Test 5: Top Performers
    console.log('\n\n🏆 STEP 6: Test getTopPerformers()');
    console.log('-'.repeat(60));

    const topPerformers = await therapistAnalytics.getTopPerformers(undefined, 10);
    console.log(`Result: ${topPerformers.length} top performers`);

    if (topPerformers.length > 0) {
      console.log('✅ First 3 performers:');
      topPerformers.slice(0, 3).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.therapistName} (${p.city}, ${p.state}): ${p.profileViews} views`);
      });
    }

    // Test 6: Supply/Demand
    console.log('\n\n📊 STEP 7: Test getSupplyDemandAnalysis()');
    console.log('-'.repeat(60));

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const supplyDemand = await businessIntelligence.getSupplyDemandAnalysis(startDate, endDate);
    console.log(`Result: ${supplyDemand.length} locations`);

    if (supplyDemand.length > 0) {
      console.log('✅ First 3 locations:');
      supplyDemand.slice(0, 3).forEach((s, i) => {
        console.log(`  ${i + 1}. ${s.city}, ${s.state}: ${s.therapistCount} therapists, ${s.searchCount} searches`);
      });
    }

    // SUMMARY
    console.log('\n\n' + '='.repeat(60));
    console.log('📋 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Database has ${totalTherapists[0].count} approved therapists`);
    console.log(`${distribution.length > 0 ? '✅' : '❌'} getTherapistDistribution: ${distribution.length} groups`);
    console.log(`${therapyTypes.length > 0 ? '✅' : '❌'} getTherapyTypeBreakdown: ${therapyTypes.length} types`);
    console.log(`${specializations.length > 0 ? '✅' : '❌'} getSpecializationBreakdown: ${specializations.length} specializations`);
    console.log(`✅ getGrowthMetrics: ${growth.monthlyGrowth.length} months`);
    console.log(`${topPerformers.length > 0 ? '✅' : '❌'} getTopPerformers: ${topPerformers.length} performers`);
    console.log(`${supplyDemand.length > 0 ? '✅' : '❌'} getSupplyDemandAnalysis: ${supplyDemand.length} locations`);

    console.log('\n✅ All tests complete!\n');

    if (distribution.length === 0) {
      console.error('🚨 CRITICAL ISSUE: getTherapistDistribution() returns empty array!');
      console.error('This is why the dashboard shows "Total Therapists: 0"');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 ERROR during testing:', error);
    throw error;
  }

  process.exit(0);
}

testAnalyticsFunctions().catch(error => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});
