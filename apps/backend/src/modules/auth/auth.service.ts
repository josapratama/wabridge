import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { UserRepository } from "../../repositories/interfaces";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { User } from "../../common/types";

@Injectable()
export class AuthService {
  constructor(
    @Inject(UserRepository)
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  getAuthHubConfig() {
    const authhubUrl =
      process.env.AUTHHUB_URL || "https://auth.josapratama.com";
    const clientId =
      process.env.AUTHHUB_CLIENT_ID || "ah_client_wabridge_6d7e8f";
    return {
      enabled: true,
      authhub_url: authhubUrl.replace(/\/+$/, ""),
      client_id: clientId,
    };
  }

  async handleAuthHubCallback(code: string) {
    if (!code || typeof code !== "string") {
      throw new BadRequestException("Kode otorisasi dari AuthHub tidak ditemukan.");
    }

    const authhubUrl = (
      process.env.AUTHHUB_URL || "https://auth.josapratama.com"
    ).replace(/\/+$/, "");
    const clientId =
      process.env.AUTHHUB_CLIENT_ID || "ah_client_wabridge_6d7e8f";
    const clientSecret =
      process.env.AUTHHUB_CLIENT_SECRET ||
      "ah_secret_wabridge_2b3c4d5e6f7a8b9c0d1e2f";

    const tokenResp = await fetch(`${authhubUrl}/api/v1/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grantType: "authorization_code",
        code,
        clientId,
        clientSecret,
      }),
      signal: AbortSignal.timeout(15000),
    });

    const tokenData = (await tokenResp.json().catch(() => null)) as any;

    if (!tokenResp.ok || !tokenData) {
      const rawErr = tokenData?.error || "Otorisasi token SSO AuthHub gagal";
      let friendlyErr = rawErr;
      if (
        rawErr.includes("Invalid, expired, or already used authorization_code")
      ) {
        friendlyErr =
          "Kode otorisasi dari AuthHub telah kedaluwarsa atau sudah digunakan. Silakan coba login kembali.";
      } else if (rawErr.includes("Invalid client_id or client_secret")) {
        friendlyErr = "Kredensial client AuthHub SSO tidak valid.";
      }
      throw new UnauthorizedException(friendlyErr);
    }

    const authUser = tokenData.user || {};
    const email = authUser.email;
    if (!email) {
      throw new UnauthorizedException("Email user tidak ditemukan dari AuthHub.");
    }

    const appRole =
      authUser.appRole ||
      (authUser.globalRole === "superadmin" ? "superadmin" : "viewer");
    if (appRole === "none") {
      throw new ForbiddenException(
        "Akses akun Anda ke WABridge dinonaktifkan oleh administrator AuthHub.",
      );
    }

    // Upsert local user
    let user = await this.userRepository.findByEmail(email);
    if (!user) {
      const randomPassword = await bcrypt.hash(uuidv4(), 10);
      user = await this.userRepository.save({
        id: uuidv4(),
        email,
        password: randomPassword,
        name: authUser.name || authUser.username || email.split("@")[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else if (authUser.name && user.name !== authUser.name) {
      const updated = await this.userRepository.update(user.id, {
        name: authUser.name,
      });
      if (updated) user = updated;
    }

    const payload = { sub: user.id, email: user.email, role: appRole };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: appRole,
      },
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user: User = {
      id: uuidv4(),
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.userRepository.save(user);
    const { password, ...result } = saved;
    return result;
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isMatch = await bcrypt.compare(dto.password, user.password!);
    if (!isMatch) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const payload = { sub: user.id, email: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async validateUser(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) return null;
    const { password, ...result } = user;
    return result;
  }
}
