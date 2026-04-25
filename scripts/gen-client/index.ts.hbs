import { getToken } from "../../lib/firebase";
import { ClientApi as _ClientApi, ApiError, OpenAPI } from "./client";

if (process.env.NEXT_PUBLIC_API_URL) {
  OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL;
}

class ClientApi extends _ClientApi {
  public async uploadFile(file: File, privateBucket?: boolean) {
    let result: Awaited<ReturnType<_ClientApi["upload"]["createUpload"]>> = {
      signedUrl: "",
      url: "",
      path: "",
    };
    try {
      result = await this.upload.createUpload({
        requestBody: {
          contentLength: file.size,
          fileName: file.name,
        },
        privateBucket,
      });
    } catch (e) {
      if (e instanceof ApiError) {
        if ("details" in e.body && e.body.details === "File too large") {
          throw new Error("File too large");
        }
      }

      throw e;
    }

    const body = new Blob([file], { type: file.type })
    await fetch(result.signedUrl, {
      method: "PUT",
      body: body,
      headers: {
        "Content-Type": file.type,
      },
    });

    return result.url ?? result.path;
  }
}

export const api = new ClientApi({
  BASE: OpenAPI.BASE,
  TOKEN: async () => {
    if (typeof window !== 'undefined') {
      // only run on client side
      const token = await getToken();
      return token ?? "";
    }
    return ""
  },
});
export * from "./client";