"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import { Shield } from "lucide-react";
import { useTheme, alpha } from "@mui/material/styles";
import { useAuthStore } from "@/store/auth";
import { useTranslation } from "@/lib/i18n";

export default function ProfilePage() {
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const { t } = useTranslation();

  if (!user) return null;

  const roleLabel =
    role === "admin"
      ? t("header.superAdmin")
      : role === "editor"
      ? t("header.editor")
      : t("header.viewer");

  const roleColor =
    role === "admin"
      ? theme.palette.primary.main
      : role === "editor"
      ? theme.palette.info.main
      : theme.palette.text.secondary;

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          {t("header.profile")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("settings.general") || "View your account information and role in this workspace."}
        </Typography>
      </Box>

      <Box
        sx={{
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
          p: 3,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 3,
          alignItems: { xs: "flex-start", sm: "center" },
        }}
      >
        <Avatar
          sx={{
            width: 64,
            height: 64,
            fontSize: 28,
            fontWeight: 700,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
            color: "#fff",
          }}
        >
          {user.name?.charAt(0)?.toUpperCase() || "N"}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={700}>
            {user.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user.email}
          </Typography>
          <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              icon={<Shield size={14} />}
              label={roleLabel}
              size="small"
              sx={{
                height: 24,
                fontSize: 11,
                fontWeight: 600,
                bgcolor: alpha(roleColor, 0.12),
                color: roleColor,
                "& .MuiChip-icon": { color: roleColor },
              }}
            />
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
          p: 3,
        }}
      >
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {t("settings.security")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t("settings.saveAllChanges") ||
            "For now your basic profile information is read-only. In a next step we can add password and security settings here."}
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Button variant="outlined" disabled>
          {t("common.edit")}
        </Button>
      </Box>
    </Box>
  );
}

