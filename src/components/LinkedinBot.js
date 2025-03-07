// Usage: node link.js <linkedin_url>
// Example: node link.js https://www.linkedin.com/in/johndoe
import fetch from "node-fetch";

class LinkedInBot {
  constructor(cookies, csrfToken, linkedinUrl) {
    this.headers = {
      cookie: cookies,
      "csrf-token": csrfToken,
      accept: "application/json",
      "accept-language": "en-US,en;q=0.9",
      "content-type": "application/json",
      referer: linkedinUrl,
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "x-restli-protocol-version": "2.0.0",
      origin: "https://www.linkedin.com",
      "x-li-lang": "en_US",
    };
  }

  async getProfileId(linkedinUrl) {
    try {
      // Extract username from URL
      const vanityName = linkedinUrl.split("/in/")[1]?.split("/")[0];
      if (!vanityName) {
        throw new Error("Invalid LinkedIn URL");
      }

      // Make request to get profile ID
      const response = await fetch(
        `https://www.linkedin.com/voyager/api/graphql?variables=(vanityName:${vanityName})&queryId=voyagerIdentityDashProfiles.2ca312bdbe80fac72fd663a3e06a83e7`,
        {
          method: "GET",
          headers: this.headers,
          credentials: "include",
          cors: "no-cors",
          sameorigin: "true",
        }
      );

      const data = await response.json();
      const profileId =
        data.data?.identityDashProfilesByMemberIdentity?.elements[0]?.entityUrn;

      if (!profileId) {
        console.error(response);
        throw new Error("Profile ID not found");
      }

      return profileId;
    } catch (error) {
      throw new Error(`Failed to get profile ID: ${error.message}`);
    }
  }

  async sendConnectionRequest(profileId) {
    try {
      const response = await fetch(
        "https://www.linkedin.com/voyager/api/voyagerRelationshipsDashMemberRelationships?action=verifyQuotaAndCreateV2&decorationId=com.linkedin.voyager.dash.deco.relationships.InvitationCreationResultWithInvitee-2",
        {
          method: "POST",
          headers: this.headers,
          credentials: "include",
          body: JSON.stringify({
            invitee: {
              inviteeUnion: {
                memberProfile: profileId,
              },
              customMessage: "hey let's connect",
            },
          }),
          cors: "no-cors",
          sameorigin: "true",
        }
      );
      console.log(response);

      const data = await response.json();

      return { data, status: response.status === 200 ? "success" : "error" };
    } catch (error) {
      throw new Error(`Failed to send connection request: ${error.message}`);
    }
  }
}

// Example usage:
async function main() {
  // Using actual cookie values
  const cookies = `bscookie="v=1&2025010611125102b08732-5806-49f0-8765-d528cd099b4eAQHgnCF8GgGFX11_6WRkS86MNNIxrCNz"; g_state={"i_l":0}; JSESSIONID="ajax:2461309554588105880"; timezone=Asia/Calcutta; li_theme=light; li_theme_set=app; bcookie="v=2&ee9fb714-8a9d-4737-887e-081fd7980141"; aam_uuid=76142658274263226460362529569355243455; li_sugr=b3738794-4130-4927-8d3b-1d65394ca71e; _guid=d951f86f-bf5a-474d-b164-d2b85e06fa31; dfpfpt=6fe7b283f34c407b80f7ba715cd1498c; AnalyticsSyncHistory=AQJ5k9y9q2liOQAAAZViiZysixqrXBy2owsUbhHwOrWbMSVUZjU9ZWhazf3rv1_sh0acmKN1CJt-lm_x5jtlEw; lms_ads=AQFquOszAJwH4gAAAZViiZ5AdEoTKUZaTgR9fuq_2IagwYW9WxCmDZzBz7nYfu-elNESaoFr_orV4-WvUHDTJpHqiHVOMz_z; lms_analytics=AQFquOszAJwH4gAAAZViiZ5AdEoTKUZaTgR9fuq_2IagwYW9WxCmDZzBz7nYfu-elNESaoFr_orV4-WvUHDTJpHqiHVOMz_z; fptctx2=taBcrIH61PuCVH7eNCyH0LNKRXFdWqLJ6b8ywJyet7VNWH5Gt7mutlJM4K1nvVm2tJ93%252fxrrmJqpRS5roVMAepA3zG1P0%252fKY6lUnTPbiVgsr8oYXR2xwUazdFGKCaKfCJ%252fQNoZsslJTv9Mn80GOJS5bYZsA8YaqZvO0hL329zy%252bNHvgJQKjIOeP1VBGZcgX4C5vrzJ9bvT5aUtYdKtJZT%252b7un5Y%252fDMiA82Ai48Bw32LlJClhlLF%252bw5KFQT3nbccF4DW0Qg6%252fC0suVVCfDgLrw57wtFs%252fSLsHJOTe4Mfn6c5qnx4ydF1u4uTgD5TFE%252bljC8lD2yvjhEypowNyRVfWERvjK%252fDMCY2834A%252bVPyl74A%253d; AMCVS_14215E3D5995C57C0A495C55%40AdobeOrg=1; AMCV_14215E3D5995C57C0A495C55%40AdobeOrg=-637568504%7CMCIDTS%7C20153%7CMCMID%7C75943018730099003170416822127649123444%7CMCAAMLH-1741774906%7C12%7CMCAAMB-1741774906%7CRKhpRz8krg2tLO6pguXWp5olkAcUniQYPHaMWWgdJ3xzPWQmdj0y%7CMCOPTOUT-1741177306s%7CNONE%7CMCCIDH%7C-446906774%7CvVersion%7C5.1.1; lang=v=2&lang=en-us; liap=true; li_at=AQEDATkxUs4FhcTyAAABlWX19nwAAAGVigJ6fFYAHIOyzLpzPQhbNvRvUCi82pRFIyNv1LtfFbMcalhVOEMyCjlWiIcMzzI4s6PyGgafjqTwuHaaiDINze7UbPIXQFCZCogrtgHk6-BNBGJ8o42H41gi; _gcl_au=1.1.1391249294.1740489514.2001892206.1741172394.1741172407; UserMatchHistory=AQINDSeZpgCs_AAAAZVmNr1me8yS4E6rjF2iPmD-PG2oUMeZSYEk2c0VJ_hgQYrr1IiFFTxFGmQg6R6yydUrXgBM-Wi2JuL69qfSuivj2tKYsRjYYq7dQ-i1tjljHO56RCFldosfk42dbFWrBWKJoTv3bM5vc7xFr5n9sMd92wNkAhU07JJUb685TO_GdjmQlJQWMKUNxmCG-zSlb8q8QDyeDfFoLWU_S2I4Q0lfb8meZcCPV_FHdgIqo3_wu-ecwdP-RIQcdORpWJaLUBEN21sPmawYnCyR5WjuvtpljDs8nkKFWxSf4GLBkR7bJM7mF6OF7rSG9yoH0YoLE1zxA4dRdHJVXrqigiyKrhiv4xM4YmaIQg; lidc="b=OB74:s=O:r=O:a=O:p=O:g=5218:u=433:x=1:i=1741176621:t=1741254430:v=2:sig=AQH7BJhbE6ihz6ygARa0trxUWfXB9EAd"; __cf_bm=YaKcMR.Gobj0yOy4fXBVBmOKqI_NOdq24HEL.aJZpV0-1741176647-1.0.1.1-1dTk6WuLXzQw9P7I7KOYev6x_HT2k17CC28y1LUNrhG7eZ.QmGLgkXh98RfbFXAGBb0hdCkPxI1hAHKW_5O2.9lFYd_.WqbRhq2UN583G.A`;
  const csrfToken = "ajax:2461309554588105880";

  const linkedinUrl = process.argv[2]; // Get URL from command line argument
  const bot = new LinkedInBot(cookies, csrfToken, linkedinUrl);

  if (!linkedinUrl) {
    console.error("Please provide a LinkedIn URL as an argument");
    process.exit(1);
  }

  try {
    console.log("Getting profile ID...");
    const profileId = await bot.getProfileId(linkedinUrl);
    console.log("Profile ID:", profileId);

    console.log("Sending connection request...");
    const result = await bot.sendConnectionRequest(profileId);
    if (result.status === "success") {
      console.log("Connection request sent successfully");
    }
    console.log("Connection request result:", result);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}
// Export the class for use in other files
module.exports = LinkedInBot;
