import { NextResponse } from "next/server";

class LinkedInError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

class LinkedInBot {
  constructor(cookies, csrfToken, linkedinUrl) {
    this.headers = {
      cookie: cookies,
      "csrf-token": csrfToken,
      accept: "application/json",
      "accept-language": "en-US,en;q=0.9",
      "content-type": "application/json",
      referer: linkedinUrl,
    };
  }

  async validateResponse(response, context) {
    if (response.status === 429) {
      throw new LinkedInError(
        "LinkedIn rate limit exceeded. Please try again later.",
        429
      );
    }
    if (response.status === 401) {
      throw new LinkedInError(
        "LinkedIn authentication failed. Please update credentials.",
        401
      );
    }
    if (!response.ok) {
      throw new LinkedInError(
        `LinkedIn ${context} failed: ${response.statusText}`,
        response.status
      );
    }
    return response;
  }

  async getProfileId(linkedinUrl) {
    try {
      const vanityName = linkedinUrl.split("/in/")[1]?.split("/")[0];
      if (!vanityName) {
        throw new LinkedInError("Invalid LinkedIn URL format", 400);
      }

      const response = await fetch(
        `https://www.linkedin.com/voyager/api/graphql?variables=(vanityName:${vanityName})&queryId=voyagerIdentityDashProfiles.2ca312bdbe80fac72fd663a3e06a83e7`,
        {
          method: "GET",
          headers: this.headers,
          credentials: "include",
        }
      );

      await this.validateResponse(response, "profile lookup");
      const data = await response.json();

      const profileId =
        data.data?.identityDashProfilesByMemberIdentity?.elements[0]?.entityUrn;
      if (!profileId) {
        throw new LinkedInError("LinkedIn profile not found", 404);
      }

      return profileId;
    } catch (error) {
      if (error instanceof LinkedInError) throw error;
      throw new LinkedInError(`Profile lookup failed: ${error.message}`, 500);
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
              customMessage: "Hey, let's connect!",
            },
          }),
        }
      );

      await this.validateResponse(response, "connection request");
      const data = await response.json();

      if (data.error) {
        throw new LinkedInError(
          data.error.message || "Connection request failed",
          400
        );
      }

      return { data, status: "success" };
    } catch (error) {
      if (error instanceof LinkedInError) throw error;
      throw new LinkedInError(
        `Connection request failed: ${error.message}`,
        500
      );
    }
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { linkedinUrl, cookies, csrfToken } = body;

    if (!linkedinUrl) {
      return NextResponse.json(
        { error: "LinkedIn URL is required" },
        { status: 400 }
      );
    }

    if (!cookies || !csrfToken) {
      return NextResponse.json(
        { error: "LinkedIn credentials are required" },
        { status: 400 }
      );
    }

    const bot = new LinkedInBot(cookies, csrfToken, linkedinUrl);
    const profileId = await bot.getProfileId(linkedinUrl);
    const result = await bot.sendConnectionRequest(profileId);

    return NextResponse.json({
      message: "Connection request sent successfully",
      data: result.data,
      status: result.status,
    });
  } catch (error) {
    const statusCode = error instanceof LinkedInError ? error.statusCode : 500;
    const message =
      error instanceof LinkedInError ? error.message : "Internal server error";

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
