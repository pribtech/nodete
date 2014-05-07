CREATE SERVICE CLASS work2_sc;

CREATE WORKLOAD work2_wl
              CURRENT CLIENT_APPLNAME('WLM_tutorial_wl2')
              SERVICE CLASS work2_sc
              COLLECT ACTIVITY DATA;