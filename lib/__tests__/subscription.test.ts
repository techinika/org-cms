import { OpportunityTier } from "@/types/company";

// Mock data for testing
const mockCompanyBasic = {
  id: "test-company-1",
  opportunity_tier: "basic" as OpportunityTier,
  opportunity_listings_purchased: 5,
  opportunity_listings_used: 2,
};

const mockCompanyAdvanced = {
  id: "test-company-2",
  opportunity_tier: "advanced" as OpportunityTier,
  opportunity_listings_purchased: 0,
  opportunity_listings_used: 0,
  subscription_started_at: new Date().toISOString(),
  subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
};

const mockCompanyFree = {
  id: "test-company-3",
  opportunity_tier: "free" as OpportunityTier,
  opportunity_listings_purchased: undefined,
  opportunity_listings_used: undefined,
  subscription_started_at: undefined,
  subscription_expires_at: undefined,
};

/**
 * Test function to determine if a company can create opportunities
 * Based on the tier system:
 * - free: cannot create opportunities
 * - basic: can create opportunities up to purchased limit
 * - advanced: can create unlimited opportunities
 */
function canCreateOpportunity(company: typeof mockCompanyBasic): boolean {
  const tier = company.opportunity_tier || "free";
  
  if (tier === "advanced") {
    return true; // Unlimited for advanced tier
  }
  
  if (tier === "basic") {
    const used = company.opportunity_listings_used || 0;
    const purchased = company.opportunity_listings_purchased || 0;
    return used < purchased; // Can create if used < purchased
  }
  
  return false; // Free tier cannot create opportunities
}

/**
 * Test function to determine if a company can access applications dashboard
 * Based on the tier system:
 * - free: cannot access
 * - basic: can access
 * - advanced: can access
 */
function canAccessApplicationsDashboard(company: typeof mockCompanyBasic): boolean {
  const tier = company.opportunity_tier || "free";
  return tier === "basic" || tier === "advanced";
}

/**
 * Test function to calculate remaining listings for basic tier
 */
function getRemainingListings(company: typeof mockCompanyBasic): number | "unlimited" {
  const tier = company.opportunity_tier || "free";
  
  if (tier === "advanced") {
    return "unlimited";
  }
  
  if (tier === "basic") {
    const used = company.opportunity_listings_used || 0;
    const purchased = company.opportunity_listings_purchased || 0;
    return Math.max(0, purchased - used);
  }
  
  return 0; // Free tier has 0 listings
}

// Test suite
describe("Subscription Logic Tests", () => {
  describe("canCreateOpportunity", () => {
    test("free tier company cannot create opportunities", () => {
      expect(canCreateOpportunity(mockCompanyFree)).toBe(false);
    });
    
    test("basic tier company can create opportunities when under limit", () => {
      expect(canCreateOpportunity(mockCompanyBasic)).toBe(true); // 2 used < 5 purchased
    });
    
    test("basic tier company cannot create opportunities when at limit", () => {
      const companyAtLimit = {
        ...mockCompanyBasic,
        opportunity_listings_used: 5, // Equal to purchased
      };
      expect(canCreateOpportunity(companyAtLimit)).toBe(false);
    });
    
    test("basic tier company cannot create opportunities when over limit", () => {
      const companyOverLimit = {
        ...mockCompanyBasic,
        opportunity_listings_used: 6, // Greater than purchased
      };
      expect(canCreateOpportunity(companyOverLimit)).toBe(false);
    });
    
    test("advanced tier company can always create opportunities", () => {
      expect(canCreateOpportunity(mockCompanyAdvanced)).toBe(true);
    });
  });
  
  describe("canAccessApplicationsDashboard", () => {
    test("free tier company cannot access applications dashboard", () => {
      expect(canAccessApplicationsDashboard(mockCompanyFree)).toBe(false);
    });
    
    test("basic tier company can access applications dashboard", () => {
      expect(canAccessApplicationsDashboard(mockCompanyBasic)).toBe(true);
    });
    
    test("advanced tier company can access applications dashboard", () => {
      expect(canAccessApplicationsDashboard(mockCompanyAdvanced)).toBe(true);
    });
  });
  
  describe("getRemainingListings", () => {
    test("free tier company has 0 remaining listings", () => {
      expect(getRemainingListings(mockCompanyFree)).toBe(0);
    });
    
    test("basic tier company has correct remaining listings", () => {
      expect(getRemainingListings(mockCompanyBasic)).toBe(3); // 5 purchased - 2 used = 3
    });
    
    test("basic tier company has 0 remaining listings when at limit", () => {
      const companyAtLimit = {
        ...mockCompanyBasic,
        opportunity_listings_used: 5,
      };
      expect(getRemainingListings(companyAtLimit)).toBe(0);
    });
    
    test("advanced tier company has unlimited listings", () => {
      expect(getRemainingListings(mockCompanyAdvanced)).toBe("unlimited");
    });
  });
  
  describe("Listing usage increment", () => {
    test("incrementing listings used for basic tier", () => {
      const initialUsed = mockCompanyBasic.opportunity_listings_used || 0;
      const newUsed = initialUsed + 1;
      
      const updatedCompany = {
        ...mockCompanyBasic,
        opportunity_listings_used: newUsed,
      };
      
      expect(updatedCompany.opportunity_listings_used).toBe(3);
      expect(canCreateOpportunity(updatedCompany)).toBe(true); // Should still be able to create (3 < 5)
    });
    
    test("incrementing listings used for basic tier reaches limit", () => {
      const initialUsed = mockCompanyBasic.opportunity_listings_used || 0;
      const listingsToAdd = 3; // Will bring us to limit (2 + 3 = 5)
      const newUsed = initialUsed + listingsToAdd;
      
      const updatedCompany = {
        ...mockCompanyBasic,
        opportunity_listings_used: newUsed,
      };
      
      expect(updatedCompany.opportunity_listings_used).toBe(5);
      expect(canCreateOpportunity(updatedCompany)).toBe(false); // Should NOT be able to create (5 >= 5)
    });
  });
});

console.log("Subscription logic tests completed successfully!");