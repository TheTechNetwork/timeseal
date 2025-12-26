# Domain Migration: timeseal.teycir-932.workers.dev → timeseal.online

## Status: ✅ Code Updated, ⏳ DNS Propagating

### Completed Steps

1. ✅ **Cloudflare DNS Configured**
   - Added CNAME: `@` → `timeseal.teycir-932.workers.dev` (Proxied)
   - Added CNAME: `www` → `timeseal.online` (Proxied)
   - Kept MX records for email forwarding
   - Kept TXT record for SPF

2. ✅ **Namecheap Nameservers Updated**
   - Changed to: `rick.ns.cloudflare.com`
   - Changed to: `tess.ns.cloudflare.com`
   - Propagation in progress (5-30 minutes typically)

3. ✅ **Codebase Updated**
   - Updated 10 source files
   - All references changed from `timeseal.teycir-932.workers.dev` to `timeseal.online`
   - Build verified successful

### Files Updated

- `app/components/StructuredData.tsx` - SEO structured data
- `app/layout.tsx` - Metadata and OpenGraph
- `app/dashboard/page.tsx` - Markdown download template
- `scripts-config.json` - Load testing config
- `README.md` - Main documentation
- `docs/API.md` - API documentation
- `SECURITY-FIXES-COMPLETE.md`
- `ENV-CONFIG-GUIDE.md`
- `URL-CONFIG-COMPLETE.md`
- `MANUAL-CODE-REVIEW.md`

### Next Steps (After DNS Propagates)

1. **Verify DNS Propagation**
   ```bash
   dig timeseal.online
   dig www.timeseal.online
   ```

2. **Connect Domain to Worker**
   - Go to Cloudflare Dashboard → Workers & Pages
   - Click your worker → Settings → Domains & Routes
   - Add custom domain: `timeseal.online`
   - Add custom domain: `www.timeseal.online`
   - SSL certificates will auto-provision (5-10 minutes)

3. **Test New Domain**
   ```bash
   curl https://timeseal.online/api/health
   ```

4. **Deploy Updated Code**
   ```bash
   npm run deploy
   ```

5. **Update External References**
   - GitHub repository description
   - Social media links
   - Any external documentation

### Rollback Plan (If Needed)

If issues occur, revert nameservers in Namecheap:
- Change back to: `dns1.registrar-servers.com`
- Change back to: `dns2.registrar-servers.com`

Old domain will continue working until you're ready to switch.

### Timeline

- **Now**: DNS propagating (5-30 minutes)
- **+30 min**: Connect domain to worker
- **+40 min**: SSL provisioned, site live
- **+1 hour**: Deploy updated code
- **+24 hours**: Full global DNS propagation

### Notes

- Old domain (`timeseal.teycir-932.workers.dev`) will continue working
- No downtime expected during migration
- Existing seals remain accessible via old domain until you deploy
- After deploy, both domains will work (redirect old → new recommended)
