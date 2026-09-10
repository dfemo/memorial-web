import { updateMemorialAction } from "@/app/ever-actions";
import type { Memorial } from "@/lib/api-v1";

export function MemorialEditForm({ memorial }: { memorial: Memorial }) {
  const action = updateMemorialAction.bind(null, memorial.id);

  return (
    <form className="form-stack" action={action} key={`${memorial.id}-${memorial.updatedAt}`}>
      <div style={{ display: "grid", gap: "0.9rem", gridTemplateColumns: "1fr 1fr 1fr" }}>
        <label>
          First name
          <input name="firstName" defaultValue={memorial.firstName} required />
        </label>
        <label>
          Middle
          <input name="middleName" defaultValue={memorial.middleName || ""} />
        </label>
        <label>
          Last name
          <input name="lastName" defaultValue={memorial.lastName} required />
        </label>
      </div>

      <div style={{ display: "grid", gap: "0.9rem", gridTemplateColumns: "1fr 1fr" }}>
        <label>
          Date of birth
          <input
            name="dateOfBirth"
            type="date"
            defaultValue={memorial.dateOfBirth?.slice(0, 10) || ""}
          />
        </label>
        <label>
          Date of passing
          <input
            name="dateOfDeath"
            type="date"
            defaultValue={memorial.dateOfDeath?.slice(0, 10) || ""}
          />
        </label>
      </div>

      <label>
        Life story
        <textarea name="biography" defaultValue={memorial.biography || ""} rows={5} />
      </label>
      <label>
        Service information
        <textarea name="serviceInfo" defaultValue={memorial.serviceInfo || ""} rows={3} />
      </label>
      <label>
        Location
        <input name="location" defaultValue={memorial.location || ""} />
      </label>

      <div style={{ display: "grid", gap: "0.9rem", gridTemplateColumns: "1fr 1fr" }}>
        <label>
          Profile photo URL
          <input name="profilePhotoUrl" defaultValue={memorial.profilePhotoUrl || ""} />
        </label>
        <label>
          Cover photo URL
          <input name="coverPhotoUrl" defaultValue={memorial.coverPhotoUrl || ""} />
        </label>
      </div>

      <div style={{ display: "grid", gap: "0.9rem", gridTemplateColumns: "1fr 1fr 1fr" }}>
        <label>
          Visibility
          <select name="privacyLevel" defaultValue={memorial.privacyLevel}>
            <option value="PUBLIC">Public — listed on Explore</option>
            <option value="INVITE_ONLY">Invite only — share invite link</option>
            <option value="PRIVATE">Private — owner only</option>
          </select>
        </label>
        <label>
          Publish status
          <select name="published" defaultValue={memorial.published ? "true" : "false"}>
            <option value="true">Published</option>
            <option value="false">Draft (hidden from public)</option>
          </select>
        </label>
        <label>
          URL slug
          <input name="slug" defaultValue={memorial.slug} required />
        </label>
      </div>

      <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: 0 }}>
        To appear on Explore, set <strong>Published</strong> and <strong>Public</strong>. Invite
        only stays off Explore — generate an invite link from Manage to share with family. Private is
        owner-only.
      </p>

      <button className="btn btn-solid" type="submit">
        Save changes
      </button>
    </form>
  );
}
